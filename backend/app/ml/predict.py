from __future__ import annotations

import pickle
from pathlib import Path
from typing import Any

import pandas as pd

from app.ml.dataset import DEFAULT_MODEL_PATH
from app.ml.features import FEATURE_COLUMNS, build_feature_frame
from app.schemas.common import season_from_day_type
from app.engine.load import generate_load_profile


def load_model_artifact(model_path: Path | str = DEFAULT_MODEL_PATH) -> dict[str, Any]:
    resolved_path = Path(model_path)
    if not resolved_path.exists():
        raise FileNotFoundError(f"Model artifact not found: {resolved_path}")

    with resolved_path.open("rb") as artifact_file:
        artifact = pickle.load(artifact_file)

    if "model" not in artifact or "feature_columns" not in artifact:
        raise ValueError(f"Model artifact at {resolved_path} is missing required metadata.")

    return artifact


def predict_feature_frame(
    feature_frame: pd.DataFrame,
    model_path: Path | str = DEFAULT_MODEL_PATH,
) -> pd.Series:
    artifact = load_model_artifact(model_path)
    feature_columns = artifact["feature_columns"]
    model = artifact["model"]

    missing_columns = set(feature_columns).difference(feature_frame.columns)
    if missing_columns:
        missing_list = ", ".join(sorted(missing_columns))
        raise ValueError(f"Feature frame is missing required columns: {missing_list}")

    predictions = model.predict(feature_frame[feature_columns])
    return pd.Series(predictions, index=feature_frame.index, name="predicted_load_kwh")


def predict_next_hour(
    history_frame: pd.DataFrame,
    model_path: Path | str = DEFAULT_MODEL_PATH,
) -> float:
    feature_frame = build_feature_frame(history_frame, include_target=False)
    if feature_frame.empty:
        raise ValueError("At least two hourly observations are required to predict the next hour load.")

    latest_features = feature_frame.iloc[[-1]][FEATURE_COLUMNS]
    artifact = load_model_artifact(model_path)
    prediction = artifact["model"].predict(latest_features)[0]
    return float(prediction)


def build_forecast_profiles(
    model: Any,
    preset_id: str,
    monthly_kwh: float,
    day_types: list[str],
) -> dict[str, list[float]]:
    """Build representative 24-hour forecast profiles for the scheduler."""
    profiles: dict[str, list[float]] = {}
    for index, day_type in enumerate(day_types):
        actual_profile = generate_load_profile(
            preset_id=preset_id,
            monthly_kwh=monthly_kwh,
            day_type=day_type,
            seed=400 + index,
        )
        timestamps = pd.date_range(
            start=f"2025-{_month_for_day_type(day_type):02d}-01",
            periods=len(actual_profile),
            freq="h",
        )
        history = pd.DataFrame(
            {
                "timestamp": timestamps,
                "day_index": [index] * len(actual_profile),
                "load_kwh": actual_profile,
            }
        )
        feature_frame = build_feature_frame(history, include_target=False)
        predicted = model.predict(feature_frame[FEATURE_COLUMNS]).tolist()
        blended_profile = [actual_profile[0]]
        for hour, predicted_value in enumerate(predicted, start=1):
            archetype_value = actual_profile[hour]
            blended_value = (0.45 * float(predicted_value)) + (0.55 * float(archetype_value))
            blended_profile.append(round(blended_value, 3))
        profile = blended_profile
        profiles[day_type] = profile[:24]
    return profiles


def _month_for_day_type(day_type: str) -> int:
    season = season_from_day_type(day_type)
    mapping = {"winter": 1, "summer": 5, "monsoon": 8}
    return mapping.get(season, 1)
