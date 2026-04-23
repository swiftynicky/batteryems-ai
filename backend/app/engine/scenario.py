from __future__ import annotations

from typing import Dict, List, Optional

from app.engine.annualize import annualize_metrics_by_day_type
from app.engine.metrics import calculate_daily_metrics
from app.engine.scheduler import dispatch_battery
from app.engine.solar import generate_solar_profile
from app.engine.tariff import calculate_hourly_cost
from app.engine.load import generate_load_profile
from app.schemas.common import DAY_TYPES, SchedulerMode
from app.schemas.request import TariffInput


def _round_series(values: List[float]) -> List[float]:
    return [round(value, 3) for value in values]


def evaluate_day_type_scenarios(
    preset_id: str,
    monthly_kwh: float,
    day_type: str,
    tariff: TariffInput,
    solar_kw: float,
    battery_kwh: float,
    scheduler_mode: SchedulerMode,
    seed: int = 42,
    forecast_profile: Optional[List[float]] = None,
    cloudiness: Optional[float] = None,
) -> Dict[str, Dict[str, object]]:
    load_profile = generate_load_profile(preset_id=preset_id, monthly_kwh=monthly_kwh, day_type=day_type, seed=seed)
    solar_profile = generate_solar_profile(installed_kw=solar_kw, day_type=day_type, cloudiness=cloudiness, seed=seed + 10)

    grid_only_imports = _round_series(load_profile)
    grid_only_exports = [0.0] * 24
    grid_only_cost = calculate_hourly_cost(grid_only_imports, grid_only_exports, tariff)
    grid_only_metrics = calculate_daily_metrics(
        load_profile=load_profile,
        solar_profile=[0.0] * 24,
        grid_import_profile=grid_only_imports,
        grid_export_profile=grid_only_exports,
        daily_bill_inr=grid_only_cost["total_cost_inr"],
    )

    solar_only_imports = _round_series([max(load - solar, 0.0) for load, solar in zip(load_profile, solar_profile)])
    solar_only_exports = _round_series([max(solar - load, 0.0) for load, solar in zip(load_profile, solar_profile)])
    solar_only_cost = calculate_hourly_cost(solar_only_imports, solar_only_exports, tariff)
    solar_only_metrics = calculate_daily_metrics(
        load_profile=load_profile,
        solar_profile=solar_profile,
        grid_import_profile=solar_only_imports,
        grid_export_profile=solar_only_exports,
        daily_bill_inr=solar_only_cost["total_cost_inr"],
    )

    battery_dispatch = dispatch_battery(
        load_profile=load_profile,
        solar_profile=solar_profile,
        battery_capacity_kwh=battery_kwh,
        tariff=tariff,
        mode=scheduler_mode,
        forecast_profile=forecast_profile,
    )
    solar_battery_cost = calculate_hourly_cost(
        battery_dispatch["grid_import_kwh"],
        battery_dispatch["grid_export_kwh"],
        tariff,
    )
    solar_battery_metrics = calculate_daily_metrics(
        load_profile=load_profile,
        solar_profile=solar_profile,
        grid_import_profile=battery_dispatch["grid_import_kwh"],
        grid_export_profile=battery_dispatch["grid_export_kwh"],
        battery_charge_profile=battery_dispatch["battery_charge_kwh"],
        battery_discharge_profile=battery_dispatch["battery_discharge_kwh"],
        daily_bill_inr=solar_battery_cost["total_cost_inr"],
        battery_capacity_kwh=battery_kwh,
    )

    return {
        "grid_only": {
            "hourly": {
                "load_kwh": load_profile,
                "solar_kwh": [0.0] * 24,
                "battery_charge_kwh": [0.0] * 24,
                "battery_discharge_kwh": [0.0] * 24,
                "soc_kwh": [0.0] * 24,
                "grid_import_kwh": grid_only_imports,
                "grid_export_kwh": grid_only_exports,
            },
            "metrics": grid_only_metrics,
        },
        "solar_only": {
            "hourly": {
                "load_kwh": load_profile,
                "solar_kwh": solar_profile,
                "battery_charge_kwh": [0.0] * 24,
                "battery_discharge_kwh": [0.0] * 24,
                "soc_kwh": [0.0] * 24,
                "grid_import_kwh": solar_only_imports,
                "grid_export_kwh": solar_only_exports,
            },
            "metrics": solar_only_metrics,
        },
        "solar_battery": {
            "hourly": {
                "load_kwh": load_profile,
                "solar_kwh": solar_profile,
                "battery_charge_kwh": battery_dispatch["battery_charge_kwh"],
                "battery_discharge_kwh": battery_dispatch["battery_discharge_kwh"],
                "soc_kwh": battery_dispatch["soc_kwh"],
                "grid_import_kwh": battery_dispatch["grid_import_kwh"],
                "grid_export_kwh": battery_dispatch["grid_export_kwh"],
            },
            "metrics": solar_battery_metrics,
        },
    }


def evaluate_annual_scenarios(
    preset_id: str,
    monthly_kwh: float,
    tariff: TariffInput,
    solar_kw: float,
    battery_kwh: float,
    scheduler_mode: SchedulerMode,
    forecast_by_day_type: Optional[Dict[str, List[float]]] = None,
    cloudiness_by_day_type: Optional[Dict[str, float]] = None,
) -> Dict[str, object]:
    daily_results: Dict[str, Dict[str, Dict[str, object]]] = {}
    per_scenario_daily_metrics: Dict[str, Dict[str, Dict[str, float]]] = {
        "grid_only": {},
        "solar_only": {},
        "solar_battery": {},
    }

    for index, day_type in enumerate(DAY_TYPES):
        day_results = evaluate_day_type_scenarios(
            preset_id=preset_id,
            monthly_kwh=monthly_kwh,
            day_type=day_type,
            tariff=tariff,
            solar_kw=solar_kw,
            battery_kwh=battery_kwh,
            scheduler_mode=scheduler_mode,
            seed=42 + index,
            forecast_profile=(forecast_by_day_type or {}).get(day_type),
            cloudiness=(cloudiness_by_day_type or {}).get(day_type),
        )
        daily_results[day_type] = day_results
        for scenario_name in per_scenario_daily_metrics:
            per_scenario_daily_metrics[scenario_name][day_type] = day_results[scenario_name]["metrics"]

    annual_results = {
        scenario_name: annualize_metrics_by_day_type(metrics_by_day_type)
        for scenario_name, metrics_by_day_type in per_scenario_daily_metrics.items()
    }

    return {
        "daily_results": daily_results,
        "annual_results": annual_results,
    }
