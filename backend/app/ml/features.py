from __future__ import annotations

import pandas as pd

FEATURE_COLUMNS = [
    "hour",
    "is_weekend",
    "previous_load_kwh",
    "rolling_mean_4h",
    "seasonal_bucket",
]
TARGET_COLUMN = "target_load_kwh"
SEASONAL_BUCKETS = {
    12: 0,
    1: 0,
    2: 0,
    3: 1,
    4: 1,
    5: 1,
    6: 2,
    7: 2,
    8: 2,
    9: 3,
    10: 3,
    11: 3,
}


def build_feature_frame(dataset: pd.DataFrame, include_target: bool = True) -> pd.DataFrame:
    required_columns = {"timestamp", "day_index", "load_kwh"}
    missing_columns = required_columns.difference(dataset.columns)
    if missing_columns:
        missing_list = ", ".join(sorted(missing_columns))
        raise ValueError(f"Dataset is missing required columns: {missing_list}")

    feature_frame = dataset.copy()
    feature_frame["timestamp"] = pd.to_datetime(feature_frame["timestamp"], utc=False)
    feature_frame = feature_frame.sort_values("timestamp").reset_index(drop=True)

    feature_frame["hour"] = feature_frame["timestamp"].dt.hour
    feature_frame["is_weekend"] = (feature_frame["timestamp"].dt.weekday >= 5).astype(int)
    feature_frame["previous_load_kwh"] = feature_frame["load_kwh"].shift(1)
    feature_frame["rolling_mean_4h"] = (
        feature_frame["load_kwh"].shift(1).rolling(window=4, min_periods=1).mean()
    )
    feature_frame["seasonal_bucket"] = feature_frame["timestamp"].dt.month.map(SEASONAL_BUCKETS).astype(int)

    drop_columns = ["previous_load_kwh", "rolling_mean_4h"]
    if include_target:
        feature_frame[TARGET_COLUMN] = feature_frame["load_kwh"].shift(-1)
        drop_columns.append(TARGET_COLUMN)

    feature_frame = feature_frame.dropna(subset=drop_columns).reset_index(drop=True)
    return feature_frame
