from __future__ import annotations

from typing import Dict, Iterable, List, Optional

from app.engine.finance import calculate_capital_cost, simple_payback_years
from app.engine.scenario import evaluate_annual_scenarios
from app.schemas.request import AnalyzeRequest

SOLAR_AREA_PER_KW_SQM = 9.0


def _normalize(value: Optional[float], minimum: float, maximum: float, invert: bool = False) -> float:
    if value is None:
        return 0.0
    if maximum == minimum:
        normalized = 1.0
    else:
        normalized = (value - minimum) / (maximum - minimum)
    return 1.0 - normalized if invert else normalized


def _build_option(
    solar_kw: float,
    battery_kwh: float,
    annual_grid_only: Dict[str, float],
    annual_solar_battery: Dict[str, float],
    request: AnalyzeRequest,
) -> Dict[str, float | None]:
    annual_savings = annual_grid_only["bill_inr"] - annual_solar_battery["bill_inr"]
    peak_reduction = 0.0
    if annual_grid_only["peak_grid_import_kw"] > 0:
        peak_reduction = (
            (annual_grid_only["peak_grid_import_kw"] - annual_solar_battery["peak_grid_import_kw"])
            / annual_grid_only["peak_grid_import_kw"]
        ) * 100

    grid_import_reduction = 0.0
    if annual_grid_only["grid_import_kwh"] > 0:
        grid_import_reduction = (
            (annual_grid_only["grid_import_kwh"] - annual_solar_battery["grid_import_kwh"])
            / annual_grid_only["grid_import_kwh"]
        ) * 100

    capital_cost = calculate_capital_cost(
        solar_kw=solar_kw,
        battery_kwh=battery_kwh,
        solar_capex_inr_per_kw=request.system_constraints.solar_capex_inr_per_kw,
        battery_capex_inr_per_kwh=request.system_constraints.battery_capex_inr_per_kwh,
    )
    payback = simple_payback_years(capital_cost, annual_savings)

    return {
        "solar_kw": solar_kw,
        "battery_kwh": battery_kwh,
        "annual_savings_inr": round(annual_savings, 3),
        "simple_payback_years": payback,
        "peak_demand_reduction_pct": round(peak_reduction, 3),
        "grid_import_reduction_pct": round(grid_import_reduction, 3),
        "capital_cost_inr": capital_cost,
        "annual_bill_inr": round(annual_solar_battery["bill_inr"], 3),
        "renewable_fraction_pct": round(annual_solar_battery["renewable_fraction_pct"] / 365.0, 3),
    }


def generate_recommendations(
    request: AnalyzeRequest,
    forecast_by_day_type: Optional[Dict[str, List[float]]] = None,
) -> Dict[str, object]:
    options: List[Dict[str, float | None]] = []
    roof_limited_max_solar_kw = min(
        request.system_constraints.max_solar_kw,
        request.building.roof_area_sqm / SOLAR_AREA_PER_KW_SQM,
    )

    for solar_kw in request.analysis.candidate_solar_kw:
        if solar_kw > roof_limited_max_solar_kw:
            continue
        for battery_kwh in request.analysis.candidate_battery_kwh:
            if battery_kwh > request.system_constraints.max_battery_kwh:
                continue

            evaluation = evaluate_annual_scenarios(
                preset_id=request.building.preset_id,
                monthly_kwh=request.building.monthly_kwh,
                tariff=request.tariff,
                solar_kw=solar_kw,
                battery_kwh=battery_kwh,
                scheduler_mode=request.analysis.scheduler_mode,
                forecast_by_day_type=forecast_by_day_type,
            )
            annual_grid_only = evaluation["annual_results"]["grid_only"]
            annual_solar_battery = evaluation["annual_results"]["solar_battery"]
            option = _build_option(
                solar_kw=solar_kw,
                battery_kwh=battery_kwh,
                annual_grid_only=annual_grid_only,
                annual_solar_battery=annual_solar_battery,
                request=request,
            )
            option["evaluation"] = evaluation
            options.append(option)

    if not options:
        raise ValueError("No feasible candidates found for the given constraints")

    savings_values = [float(item["annual_savings_inr"]) for item in options]
    peak_values = [float(item["peak_demand_reduction_pct"]) for item in options]
    import_values = [float(item["grid_import_reduction_pct"]) for item in options]
    payback_values = [float(item["simple_payback_years"]) for item in options if item["simple_payback_years"] is not None]

    for option in options:
        option["score"] = round(
            (0.45 * _normalize(float(option["annual_savings_inr"]), min(savings_values), max(savings_values)))
            + (0.25 * _normalize(float(option["peak_demand_reduction_pct"]), min(peak_values), max(peak_values)))
            + (0.20 * _normalize(float(option["grid_import_reduction_pct"]), min(import_values), max(import_values)))
            - (
                0.10
                * _normalize(
                    float(option["simple_payback_years"]) if option["simple_payback_years"] is not None else max(payback_values or [10.0]),
                    min(payback_values or [0.0]),
                    max(payback_values or [1.0]),
                )
            ),
            4,
        )

    feasible_by_payback = [item for item in options if item["simple_payback_years"] is not None]
    best_balanced = max(options, key=lambda item: float(item["score"]))
    best_by_savings = max(options, key=lambda item: float(item["annual_savings_inr"]))
    best_by_payback = min(feasible_by_payback, key=lambda item: float(item["simple_payback_years"])) if feasible_by_payback else None

    ranked = sorted(options, key=lambda item: float(item["score"]), reverse=True)
    return {
        "best_balanced": best_balanced,
        "best_by_savings": best_by_savings,
        "best_by_payback": best_by_payback,
        "top_ranked": ranked[:5],
    }
