from __future__ import annotations

from typing import Dict, Iterable, List

from app.schemas.request import TariffInput


def get_import_rate(hour: int, tariff: TariffInput) -> float:
    if tariff.type == "flat" or tariff.tou is None:
        return tariff.flat_rate_inr_per_kwh

    if tariff.tou.peak_start_hour <= hour <= tariff.tou.peak_end_hour:
        return tariff.tou.peak_rate_inr_per_kwh
    if 0 <= hour <= 5 or 22 <= hour <= 23:
        return tariff.tou.off_peak_rate_inr_per_kwh
    return tariff.tou.standard_rate_inr_per_kwh


def is_peak_hour(hour: int, tariff: TariffInput) -> bool:
    if tariff.type != "tou" or tariff.tou is None:
        return 17 <= hour <= 21
    return tariff.tou.peak_start_hour <= hour <= tariff.tou.peak_end_hour


def calculate_hourly_cost(
    imports_kwh: Iterable[float],
    exports_kwh: Iterable[float],
    tariff: TariffInput,
) -> Dict[str, List[float] | float]:
    import_costs: List[float] = []
    export_credits: List[float] = []
    net_costs: List[float] = []

    for hour, (grid_import, grid_export) in enumerate(zip(imports_kwh, exports_kwh)):
        import_cost = grid_import * get_import_rate(hour, tariff)
        export_credit = grid_export * tariff.feed_in_rate_inr_per_kwh
        net_cost = import_cost - export_credit
        import_costs.append(round(import_cost, 3))
        export_credits.append(round(export_credit, 3))
        net_costs.append(round(net_cost, 3))

    return {
        "import_costs_inr": import_costs,
        "export_credits_inr": export_credits,
        "net_costs_inr": net_costs,
        "total_cost_inr": round(sum(net_costs), 3),
    }
