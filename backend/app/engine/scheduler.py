from __future__ import annotations

from typing import Dict, List, Optional

from app.engine.battery import BatteryModel
from app.engine.tariff import get_import_rate, is_peak_hour
from app.schemas.common import SchedulerMode
from app.schemas.request import TariffInput


def _fallback_forecast(load_profile: List[float]) -> List[float]:
    forecast = []
    for index, value in enumerate(load_profile):
        previous_value = load_profile[index - 1] if index > 0 else value
        next_value = load_profile[index + 1] if index < len(load_profile) - 1 else value
        forecast.append(round((0.25 * previous_value) + (0.5 * value) + (0.25 * next_value), 3))
    return forecast


def dispatch_battery(
    load_profile: List[float],
    solar_profile: List[float],
    battery_capacity_kwh: float,
    tariff: TariffInput,
    mode: SchedulerMode,
    forecast_profile: Optional[List[float]] = None,
) -> Dict[str, List[float]]:
    battery = BatteryModel(capacity_kwh=battery_capacity_kwh)
    forecast = forecast_profile or _fallback_forecast(load_profile)

    charge_profile: List[float] = []
    discharge_profile: List[float] = []
    soc_profile: List[float] = []
    grid_import_profile: List[float] = []
    grid_export_profile: List[float] = []

    daily_average_load = sum(load_profile) / len(load_profile)

    for hour in range(24):
        load_kwh = load_profile[hour]
        solar_kwh = solar_profile[hour]
        surplus = max(solar_kwh - load_kwh, 0.0)
        deficit = max(load_kwh - solar_kwh, 0.0)

        charge_kwh = battery.charge_from_surplus(surplus)
        discharge_request = 0.0

        if deficit > 0 and battery_capacity_kwh > 0:
            if mode == "greedy":
                discharge_request = deficit
            elif mode == "rule_based":
                if is_peak_hour(hour, tariff):
                    remaining_peak_hours = _remaining_peak_hours(hour, tariff)
                    remaining_deficits = [max(load_profile[h] - solar_profile[h], 0.0) for h in remaining_peak_hours]
                    available_deliverable = max(
                        (battery.soc_kwh - battery.min_soc_kwh) * battery.discharge_efficiency,
                        0.0,
                    )
                    target_import = _target_import_for_peak_shaving(remaining_deficits, available_deliverable)
                    discharge_request = min(max(deficit - target_import, 0.0), available_deliverable)
                elif hour >= 21 and battery.soc_kwh > battery.capacity_kwh * 0.30:
                    discharge_request = deficit
            else:
                forecast_window = forecast[hour : min(hour + 4, 24)]
                forecast_peak = max(forecast_window) if forecast_window else forecast[hour]
                baseline_rate = tariff.flat_rate_inr_per_kwh
                if tariff.type == "tou" and tariff.tou is not None:
                    baseline_rate = tariff.tou.standard_rate_inr_per_kwh
                high_price = get_import_rate(hour, tariff) >= baseline_rate
                anticipated_peak = forecast_peak >= daily_average_load * 1.06
                if is_peak_hour(hour, tariff):
                    remaining_peak_hours = _remaining_peak_hours(hour, tariff)
                    remaining_forecast_deficits = [max(forecast[h] - solar_profile[h], 0.0) for h in remaining_peak_hours]
                    current_forecast_deficit = remaining_forecast_deficits[0] if remaining_forecast_deficits else 0.0
                    available_deliverable = max(
                        (battery.soc_kwh - battery.min_soc_kwh) * battery.discharge_efficiency,
                        0.0,
                    )
                    target_import = _target_import_for_peak_shaving(remaining_forecast_deficits, available_deliverable)
                    requested_from_forecast = max(current_forecast_deficit - target_import, 0.0)
                    discharge_request = min(deficit, requested_from_forecast, available_deliverable)
                elif tariff.type == "tou" and anticipated_peak and high_price:
                    discharge_request = min(deficit, max(forecast_peak - solar_kwh, 0.0))
                elif hour >= 21 and battery.soc_kwh > battery.capacity_kwh * 0.25:
                    discharge_request = deficit

            discharge_kwh = battery.discharge_to_load(discharge_request)
        else:
            discharge_kwh = 0.0

        grid_import = max(deficit - discharge_kwh, 0.0)
        grid_export = max(surplus - charge_kwh, 0.0)

        charge_profile.append(round(charge_kwh, 3))
        discharge_profile.append(round(discharge_kwh, 3))
        soc_profile.append(round(battery.soc_kwh, 3))
        grid_import_profile.append(round(grid_import, 3))
        grid_export_profile.append(round(grid_export, 3))

    return {
        "battery_charge_kwh": charge_profile,
        "battery_discharge_kwh": discharge_profile,
        "soc_kwh": soc_profile,
        "grid_import_kwh": grid_import_profile,
        "grid_export_kwh": grid_export_profile,
        "battery_throughput_kwh": round(battery.throughput_kwh, 3),
    }


def _remaining_peak_hours(hour: int, tariff: TariffInput) -> List[int]:
    return [candidate_hour for candidate_hour in range(hour, 24) if is_peak_hour(candidate_hour, tariff)]


def _target_import_for_peak_shaving(
    deficits: List[float],
    available_deliverable: float,
) -> float:
    if not deficits:
        return 0.0
    return max((sum(deficits) - available_deliverable) / len(deficits), 0.0)
