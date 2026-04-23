from __future__ import annotations

from typing import Dict, Mapping

from app.schemas.common import DAY_TYPE_WEIGHTS


def annualize_metrics_by_day_type(
    metrics_by_day_type: Mapping[str, Dict[str, float]],
    day_type_weights: Mapping[str, int] | None = None,
) -> Dict[str, float]:
    weights = day_type_weights or DAY_TYPE_WEIGHTS
    annual: Dict[str, float] = {}
    peak_key = "peak_grid_import_kw"

    for day_type, metrics in metrics_by_day_type.items():
        weight = weights[day_type]
        for key, value in metrics.items():
            if key == peak_key:
                annual[key] = max(annual.get(key, 0.0), value)
            else:
                annual[key] = annual.get(key, 0.0) + (value * weight)

    for key, value in annual.items():
        annual[key] = round(value, 3)
    return annual
