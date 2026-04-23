from __future__ import annotations

from typing import Dict, List, Optional


def calculate_daily_metrics(
    load_profile: List[float],
    solar_profile: List[float],
    grid_import_profile: List[float],
    grid_export_profile: List[float],
    battery_charge_profile: Optional[List[float]] = None,
    battery_discharge_profile: Optional[List[float]] = None,
    daily_bill_inr: float = 0.0,
    battery_capacity_kwh: float = 0.0,
) -> Dict[str, float]:
    battery_charge_profile = battery_charge_profile or [0.0] * 24
    battery_discharge_profile = battery_discharge_profile or [0.0] * 24

    total_load = sum(load_profile)
    total_solar = sum(solar_profile)
    total_grid_import = sum(grid_import_profile)
    total_grid_export = sum(grid_export_profile)
    direct_solar_to_load = sum(min(load, solar) for load, solar in zip(load_profile, solar_profile))
    battery_to_load = sum(battery_discharge_profile)
    solar_self_consumed = min(total_solar, direct_solar_to_load + sum(battery_charge_profile))
    renewable_served = direct_solar_to_load + battery_to_load
    throughput = sum(battery_discharge_profile)

    return {
        "bill_inr": round(daily_bill_inr, 3),
        "load_kwh": round(total_load, 3),
        "solar_generation_kwh": round(total_solar, 3),
        "grid_import_kwh": round(total_grid_import, 3),
        "grid_export_kwh": round(total_grid_export, 3),
        "solar_self_consumed_kwh": round(solar_self_consumed, 3),
        "solar_self_consumption_pct": round((solar_self_consumed / total_solar) * 100, 3) if total_solar else 0.0,
        "renewable_fraction_pct": round((renewable_served / total_load) * 100, 3) if total_load else 0.0,
        "peak_grid_import_kw": round(max(grid_import_profile) if grid_import_profile else 0.0, 3),
        "battery_throughput_kwh": round(throughput, 3),
        "battery_utilization_cycles": round(throughput / battery_capacity_kwh, 3) if battery_capacity_kwh else 0.0,
    }
