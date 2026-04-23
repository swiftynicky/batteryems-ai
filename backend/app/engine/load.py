from __future__ import annotations

import math
from typing import Dict, List, Optional

import numpy as np

from app.schemas.common import is_weekend, season_from_day_type


BASE_SHAPES: Dict[str, List[float]] = {
    "apartment_society": [
        0.026, 0.024, 0.022, 0.022, 0.024, 0.03, 0.039, 0.046, 0.049, 0.045, 0.041, 0.04,
        0.039, 0.038, 0.039, 0.041, 0.046, 0.055, 0.066, 0.072, 0.07, 0.06, 0.045, 0.032,
    ],
    "office_building": [
        0.018, 0.017, 0.017, 0.017, 0.018, 0.022, 0.032, 0.05, 0.072, 0.079, 0.08, 0.078,
        0.075, 0.074, 0.073, 0.074, 0.076, 0.071, 0.055, 0.039, 0.028, 0.023, 0.02, 0.019,
    ],
    "telecom_tower": [
        0.042, 0.042, 0.041, 0.041, 0.04, 0.04, 0.041, 0.041, 0.042, 0.042, 0.042, 0.042,
        0.042, 0.042, 0.043, 0.043, 0.043, 0.043, 0.042, 0.042, 0.042, 0.042, 0.042, 0.041,
    ],
}

SEASONAL_FACTORS = {
    "summer": 1.08,
    "monsoon": 1.0,
    "winter": 0.94,
}


def _preset_shape(preset_id: str) -> np.ndarray:
    return np.array(BASE_SHAPES.get(preset_id, BASE_SHAPES["apartment_society"]), dtype=float)


def generate_load_profile(
    preset_id: str,
    monthly_kwh: float,
    day_type: str,
    seed: Optional[int] = None,
) -> List[float]:
    """Generate a 24-point hourly load profile in kWh for a representative day."""
    rng = np.random.default_rng(seed)
    base = _preset_shape(preset_id)
    average_daily_kwh = monthly_kwh / 30.0

    season = season_from_day_type(day_type)
    seasonal_factor = SEASONAL_FACTORS.get(season, 1.0)
    weekend_factor = 0.92 if is_weekend(day_type) else 1.0

    profile = base * average_daily_kwh

    if preset_id == "office_building" and is_weekend(day_type):
        office_weekend_shape = np.array(
            [
                0.023, 0.022, 0.021, 0.021, 0.021, 0.022, 0.027, 0.036, 0.051, 0.058, 0.06,
                0.061, 0.061, 0.06, 0.059, 0.059, 0.057, 0.053, 0.045, 0.038, 0.031, 0.027,
                0.025, 0.023,
            ]
        )
        profile = office_weekend_shape * average_daily_kwh

    morning_bump = np.array([1 + 0.04 * math.exp(-0.5 * ((hour - 8) / 2.2) ** 2) for hour in range(24)])
    evening_bump = np.array([1 + 0.08 * math.exp(-0.5 * ((hour - 19) / 2.4) ** 2) for hour in range(24)])
    if preset_id == "office_building":
        evening_bump *= 0.7

    noise = rng.normal(loc=1.0, scale=0.05, size=24)
    noise = np.clip(noise, 0.85, 1.15)

    raw_profile = profile * seasonal_factor * weekend_factor * morning_bump * evening_bump * noise
    normalized = raw_profile / raw_profile.sum()
    hourly_kwh = normalized * average_daily_kwh * seasonal_factor * weekend_factor
    return np.round(hourly_kwh, 3).tolist()
