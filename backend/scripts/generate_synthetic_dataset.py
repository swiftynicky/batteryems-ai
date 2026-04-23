from __future__ import annotations

import argparse
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.ml.dataset import (
    DEFAULT_DATASET_PATH,
    DEFAULT_MONTHLY_KWH,
    DEFAULT_NUM_DAYS,
    DEFAULT_PRESET_ID,
    DEFAULT_RANDOM_SEED,
    generate_synthetic_load_dataset,
    save_dataset,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate the synthetic hourly load dataset used by the BatteryEMS forecast benchmark."
    )
    parser.add_argument("--days", type=int, default=DEFAULT_NUM_DAYS, help="Number of synthetic days to generate.")
    parser.add_argument("--seed", type=int, default=DEFAULT_RANDOM_SEED, help="Random seed for deterministic output.")
    parser.add_argument("--preset-id", default=DEFAULT_PRESET_ID, help="Building preset used to scale the synthetic profile.")
    parser.add_argument("--monthly-kwh", type=float, default=DEFAULT_MONTHLY_KWH, help="Monthly building energy used to scale the synthetic profile.")
    parser.add_argument(
        "--output",
        default=str(DEFAULT_DATASET_PATH),
        help="CSV output path. Defaults to backend/app/data/synthetic_load_forecast_dataset.csv.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    dataset = generate_synthetic_load_dataset(
        num_days=args.days,
        seed=args.seed,
        preset_id=args.preset_id,
        monthly_kwh=args.monthly_kwh,
    )
    output_path = save_dataset(dataset, args.output)

    print(f"Generated dataset: {output_path}")
    print(f"Rows: {len(dataset)}")
    print(f"Days: {dataset['day_index'].nunique()}")
    print(f"Window: {dataset['timestamp'].min()} -> {dataset['timestamp'].max()}")
    print(f"Mean load (kWh): {dataset['load_kwh'].mean():.4f}")


if __name__ == "__main__":
    main()
