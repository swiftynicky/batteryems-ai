from __future__ import annotations

from typing import List, Optional

import numpy as np

from app.schemas.common import season_from_day_type


SEASONAL_IRRADIANCE = {
    "summer": 5.7,
    "monsoon": 4.4,
    "winter": 5.0,
}

DAYLIGHT_WINDOWS = {
    "summer": (6, 18),
    "monsoon": (6, 18),
    "winter": (7, 17),
}

DERATING_FACTOR = 0.87


def generate_solar_profile(
    installed_kw: float,
    day_type: str,
    cloudiness: Optional[float] = None,
    seed: Optional[int] = None,
) -> List[float]:
    """Generate a 24-point hourly solar generation profile in kWh."""
    if installed_kw <= 0:
        return [0.0] * 24

    rng = np.random.default_rng(seed)
    season = season_from_day_type(day_type)
    sunrise, sunset = DAYLIGHT_WINDOWS.get(season, (6, 18))
    hours = np.arange(24)

    midpoint = (sunrise + sunset) / 2
    spread = max((sunset - sunrise) / 4.0, 1.75)
    gaussian = np.exp(-0.5 * ((hours - midpoint) / spread) ** 2)
    gaussian[(hours < sunrise) | (hours > sunset)] = 0

    cloud_factor = 1.0 - (cloudiness if cloudiness is not None else rng.uniform(0.1, 0.35))
    peak_sun_hours = SEASONAL_IRRADIANCE.get(season, 4.8)

    profile = gaussian / gaussian.sum()
    daily_energy = installed_kw * peak_sun_hours * DERATING_FACTOR * cloud_factor
    hourly = np.round(profile * daily_energy, 3)
    return hourly.tolist()
