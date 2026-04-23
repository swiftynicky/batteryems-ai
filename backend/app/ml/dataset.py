from __future__ import annotations

from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from app.engine.load import generate_load_profile
from app.schemas.common import DAY_TYPES, season_from_day_type

DEFAULT_NUM_DAYS = 50
DEFAULT_RANDOM_SEED = 42
HOURS_PER_DAY = 24
DEFAULT_PRESET_ID = "apartment_society"
DEFAULT_MONTHLY_KWH = 12000.0

BACKEND_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATASET_PATH = BACKEND_ROOT / "app" / "data" / "synthetic_load_forecast_dataset.csv"
DEFAULT_MODEL_PATH = BACKEND_ROOT / "app" / "data" / "load_forecast_decision_tree.pkl"

_SEASON_BASE_DATES = {
    "winter": datetime(2025, 1, 1),
    "summer": datetime(2025, 5, 1),
    "monsoon": datetime(2025, 8, 1),
}
_DAY_TYPE_WEIGHTS = np.array([88, 26, 88, 26, 103, 34], dtype=float)
_DAY_TYPE_WEIGHTS = _DAY_TYPE_WEIGHTS / _DAY_TYPE_WEIGHTS.sum()


def ensure_parent_dir(path: Path | str) -> Path:
    resolved_path = Path(path)
    resolved_path.parent.mkdir(parents=True, exist_ok=True)
    return resolved_path


def _select_day_type(rng: np.random.Generator) -> str:
    return str(rng.choice(DAY_TYPES, p=_DAY_TYPE_WEIGHTS))


def _timestamp_for_day(day_type: str, day_index: int) -> datetime:
    season = season_from_day_type(day_type)
    base_date = _SEASON_BASE_DATES[season]
    return base_date + timedelta(days=day_index)


def _perturb_profile(
    profile: list[float],
    rng: np.random.Generator,
) -> list[float]:
    daily_scale = rng.uniform(0.88, 1.16)
    hourly_noise = rng.normal(loc=1.0, scale=0.12, size=24)
    hourly_noise = np.clip(hourly_noise, 0.72, 1.35)
    perturbed = np.array(profile, dtype=float) * daily_scale * hourly_noise

    spike_count = int(rng.integers(1, 4))
    spike_hours = rng.choice(np.arange(6, 23), size=spike_count, replace=False)
    for spike_hour in spike_hours:
        perturbed[spike_hour] *= rng.uniform(1.08, 1.28)

    dip_hour = int(rng.integers(0, 24))
    perturbed[dip_hour] *= rng.uniform(0.75, 0.9)
    return np.round(np.clip(perturbed, 0.2, None), 4).tolist()


def generate_synthetic_load_dataset(
    num_days: int = DEFAULT_NUM_DAYS,
    seed: int = DEFAULT_RANDOM_SEED,
    preset_id: str = DEFAULT_PRESET_ID,
    monthly_kwh: float = DEFAULT_MONTHLY_KWH,
) -> pd.DataFrame:
    if num_days < 2:
        raise ValueError("num_days must be at least 2 to support next-hour forecasting.")

    rng = np.random.default_rng(seed)
    records: list[dict[str, Any]] = []

    for day_index in range(num_days):
        day_type = _select_day_type(rng)
        day_start = _timestamp_for_day(day_type, day_index)
        profile = generate_load_profile(
            preset_id=preset_id,
            monthly_kwh=monthly_kwh,
            day_type=day_type,
            seed=seed + day_index,
        )
        perturbed_profile = _perturb_profile(profile, rng)

        for hour, load_kwh in enumerate(perturbed_profile):
            timestamp = day_start + timedelta(hours=hour)
            records.append(
                {
                    "timestamp": timestamp,
                    "day_index": day_index,
                    "day_type": day_type,
                    "load_kwh": load_kwh,
                }
            )

    dataset = pd.DataFrame.from_records(records)
    dataset["timestamp"] = pd.to_datetime(dataset["timestamp"], utc=False)
    return dataset.sort_values("timestamp").reset_index(drop=True)


def save_dataset(dataset: pd.DataFrame, path: Path | str = DEFAULT_DATASET_PATH) -> Path:
    output_path = ensure_parent_dir(path)
    dataset.to_csv(output_path, index=False)
    return output_path


def load_dataset(path: Path | str = DEFAULT_DATASET_PATH) -> pd.DataFrame:
    dataset_path = Path(path)
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_path}")

    dataset = pd.read_csv(dataset_path, parse_dates=["timestamp"])
    required_columns = {"timestamp", "day_index", "load_kwh"}
    missing_columns = required_columns.difference(dataset.columns)
    if missing_columns:
        missing_list = ", ".join(sorted(missing_columns))
        raise ValueError(f"Dataset is missing required columns: {missing_list}")

    return dataset.sort_values("timestamp").reset_index(drop=True)
