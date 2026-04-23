from __future__ import annotations

import pickle
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.tree import DecisionTreeRegressor

from app.ml.dataset import (
    DEFAULT_DATASET_PATH,
    DEFAULT_MODEL_PATH,
    DEFAULT_MONTHLY_KWH,
    DEFAULT_NUM_DAYS,
    DEFAULT_PRESET_ID,
    DEFAULT_RANDOM_SEED,
    ensure_parent_dir,
    generate_synthetic_load_dataset,
    load_dataset,
    save_dataset,
)
from app.ml.features import FEATURE_COLUMNS, TARGET_COLUMN, build_feature_frame


@dataclass(frozen=True)
class TrainingResult:
    dataset_path: Path
    model_path: Path
    rmse: float
    mae: float
    train_days: int
    test_days: int
    train_rows: int
    test_rows: int

    def as_dict(self) -> dict[str, Any]:
        return {
            "dataset_path": str(self.dataset_path),
            "model_path": str(self.model_path),
            "rmse": self.rmse,
            "mae": self.mae,
            "train_days": self.train_days,
            "test_days": self.test_days,
            "train_rows": self.train_rows,
            "test_rows": self.test_rows,
        }


def split_feature_frame_by_day(
    feature_frame: pd.DataFrame,
    train_days: int = 40,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    available_days = sorted(feature_frame["day_index"].unique())
    if len(available_days) < 2:
        raise ValueError("At least two unique days are required for train/test splitting.")

    if train_days <= 0 or train_days >= len(available_days):
        raise ValueError(
            f"train_days must be between 1 and {len(available_days) - 1}, received {train_days}."
        )

    train_day_set = set(available_days[:train_days])
    train_frame = feature_frame[feature_frame["day_index"].isin(train_day_set)].reset_index(drop=True)
    test_frame = feature_frame[~feature_frame["day_index"].isin(train_day_set)].reset_index(drop=True)

    if train_frame.empty or test_frame.empty:
        raise ValueError("Train/test split produced an empty partition.")

    return train_frame, test_frame


def save_model_artifact(artifact: dict[str, Any], model_path: Path | str = DEFAULT_MODEL_PATH) -> Path:
    output_path = ensure_parent_dir(model_path)
    with output_path.open("wb") as artifact_file:
        pickle.dump(artifact, artifact_file)
    return output_path


def train_load_forecast_model(
    dataset_path: Path | str = DEFAULT_DATASET_PATH,
    model_path: Path | str = DEFAULT_MODEL_PATH,
    train_days: int = 40,
    random_state: int = 42,
    max_depth: int = 8,
    min_samples_leaf: int = 2,
) -> TrainingResult:
    dataset = load_dataset(dataset_path)
    feature_frame = build_feature_frame(dataset, include_target=True)
    train_frame, test_frame = split_feature_frame_by_day(feature_frame, train_days=train_days)

    model = DecisionTreeRegressor(
        random_state=random_state,
        max_depth=max_depth,
        min_samples_leaf=min_samples_leaf,
    )
    model.fit(train_frame[FEATURE_COLUMNS], train_frame[TARGET_COLUMN])

    predictions = model.predict(test_frame[FEATURE_COLUMNS])
    rmse = float(np.sqrt(mean_squared_error(test_frame[TARGET_COLUMN], predictions)))
    mae = float(mean_absolute_error(test_frame[TARGET_COLUMN], predictions))

    artifact = {
        "model": model,
        "feature_columns": FEATURE_COLUMNS,
        "target_column": TARGET_COLUMN,
        "metrics": {"rmse": rmse, "mae": mae},
        "train_days": train_days,
        "test_days": len(sorted(feature_frame["day_index"].unique())) - train_days,
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    resolved_model_path = save_model_artifact(artifact, model_path)

    return TrainingResult(
        dataset_path=Path(dataset_path),
        model_path=resolved_model_path,
        rmse=rmse,
        mae=mae,
        train_days=train_days,
        test_days=artifact["test_days"],
        train_rows=len(train_frame),
        test_rows=len(test_frame),
    )


def train_forecaster(preset_id: str, monthly_kwh: float) -> dict[str, Any]:
    """Compatibility wrapper used by the analysis service."""
    dataset = generate_synthetic_load_dataset(
        num_days=DEFAULT_NUM_DAYS,
        seed=DEFAULT_RANDOM_SEED,
        preset_id=preset_id or DEFAULT_PRESET_ID,
        monthly_kwh=monthly_kwh or DEFAULT_MONTHLY_KWH,
    )
    temp_root = Path(tempfile.gettempdir()) / "batteryems-ai-ml"
    temp_root.mkdir(parents=True, exist_ok=True)
    run_id = uuid4().hex
    dataset_path = save_dataset(dataset, temp_root / f"synthetic_load_forecast_dataset_{run_id}.csv")
    model_path = temp_root / f"load_forecast_decision_tree_{run_id}.pkl"
    result = train_load_forecast_model(
        dataset_path=dataset_path,
        model_path=model_path,
        train_days=40,
        random_state=DEFAULT_RANDOM_SEED,
    )
    with Path(result.model_path).open("rb") as artifact_file:
        artifact = pickle.load(artifact_file)
    return {
        "model": artifact["model"],
        "metrics": {
            "rmse_kw": round(result.rmse, 4),
            "mae_kw": round(result.mae, 4),
        },
        "preset_id": preset_id,
    }
