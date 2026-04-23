from __future__ import annotations

import argparse
import sys
from pathlib import Path
from time import perf_counter

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.ml.dataset import (
    DEFAULT_DATASET_PATH,
    DEFAULT_MONTHLY_KWH,
    DEFAULT_MODEL_PATH,
    DEFAULT_NUM_DAYS,
    DEFAULT_PRESET_ID,
    DEFAULT_RANDOM_SEED,
    generate_synthetic_load_dataset,
    load_dataset,
    save_dataset,
)
from app.ml.features import FEATURE_COLUMNS, build_feature_frame
from app.ml.predict import load_model_artifact, predict_next_hour
from app.ml.train import split_feature_frame_by_day, train_load_forecast_model


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Benchmark the forecast-assisted scheduler's load forecast model on the synthetic BatteryEMS dataset."
    )
    parser.add_argument(
        "--dataset",
        default=str(DEFAULT_DATASET_PATH),
        help="CSV dataset path. Generated automatically if missing.",
    )
    parser.add_argument(
        "--model",
        default=str(DEFAULT_MODEL_PATH),
        help="Pickle artifact path for the trained decision tree model.",
    )
    parser.add_argument("--days", type=int, default=DEFAULT_NUM_DAYS, help="Number of synthetic days to generate.")
    parser.add_argument("--seed", type=int, default=DEFAULT_RANDOM_SEED, help="Random seed for dataset generation.")
    parser.add_argument("--preset-id", default=DEFAULT_PRESET_ID, help="Building preset used for synthetic training data.")
    parser.add_argument("--monthly-kwh", type=float, default=DEFAULT_MONTHLY_KWH, help="Monthly building energy used for synthetic training data.")
    parser.add_argument("--train-days", type=int, default=40, help="Number of days reserved for training.")
    parser.add_argument(
        "--iterations",
        type=int,
        default=250,
        help="Number of repeated prediction loops used for latency benchmarking.",
    )
    parser.add_argument(
        "--regenerate",
        action="store_true",
        help="Regenerate the synthetic dataset even if the CSV already exists.",
    )
    return parser.parse_args()


def _ensure_dataset(
    dataset_path: Path,
    days: int,
    seed: int,
    regenerate: bool,
    preset_id: str,
    monthly_kwh: float,
) -> Path:
    if regenerate or not dataset_path.exists():
        dataset = generate_synthetic_load_dataset(
            num_days=days,
            seed=seed,
            preset_id=preset_id,
            monthly_kwh=monthly_kwh,
        )
        save_dataset(dataset, dataset_path)
    return dataset_path


def main() -> None:
    args = parse_args()
    dataset_path = _ensure_dataset(
        Path(args.dataset),
        args.days,
        args.seed,
        args.regenerate,
        args.preset_id,
        args.monthly_kwh,
    )

    training_result = train_load_forecast_model(
        dataset_path=dataset_path,
        model_path=args.model,
        train_days=args.train_days,
        random_state=args.seed,
    )

    dataset = load_dataset(dataset_path)
    feature_frame = build_feature_frame(dataset, include_target=True)
    _, test_frame = split_feature_frame_by_day(feature_frame, train_days=args.train_days)

    artifact = load_model_artifact(args.model)
    model = artifact["model"]
    test_features = test_frame[FEATURE_COLUMNS]

    batch_start = perf_counter()
    for _ in range(args.iterations):
        model.predict(test_features)
    batch_elapsed_ms = ((perf_counter() - batch_start) * 1000.0) / args.iterations

    history_frame = dataset.iloc[: (args.train_days * 24) + 24].copy()
    single_start = perf_counter()
    for _ in range(args.iterations):
        predict_next_hour(history_frame, model_path=args.model)
    single_elapsed_ms = ((perf_counter() - single_start) * 1000.0) / args.iterations

    print("BatteryEMS forecast benchmark")
    print(f"Dataset: {dataset_path}")
    print(f"Model: {training_result.model_path}")
    print(f"Train/Test days: {training_result.train_days}/{training_result.test_days}")
    print(f"Train/Test rows: {training_result.train_rows}/{training_result.test_rows}")
    print(f"RMSE: {training_result.rmse:.4f}")
    print(f"MAE: {training_result.mae:.4f}")
    print(f"Average batch prediction latency (ms): {batch_elapsed_ms:.4f}")
    print(f"Average single-step forecast latency (ms): {single_elapsed_ms:.4f}")


if __name__ == "__main__":
    main()
