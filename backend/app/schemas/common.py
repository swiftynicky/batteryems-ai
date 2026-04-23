from __future__ import annotations

from typing import Literal


DAY_TYPES = (
    "summer_weekday",
    "summer_weekend",
    "monsoon_weekday",
    "monsoon_weekend",
    "winter_weekday",
    "winter_weekend",
)

DAY_TYPE_WEIGHTS = {
    "summer_weekday": 88,
    "summer_weekend": 26,
    "monsoon_weekday": 88,
    "monsoon_weekend": 26,
    "winter_weekday": 103,
    "winter_weekend": 34,
}

SEASONAL_BUCKETS = ("summer", "monsoon", "winter")

SchedulerMode = Literal["greedy", "rule_based", "forecast_assisted"]
TariffType = Literal["flat", "tou"]
ObjectiveType = Literal["balanced", "savings", "payback"]


def season_from_day_type(day_type: str) -> str:
    return day_type.split("_", maxsplit=1)[0]


def is_weekend(day_type: str) -> bool:
    return day_type.endswith("weekend")
