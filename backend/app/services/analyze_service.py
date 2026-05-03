from __future__ import annotations

from typing import Dict, List, Optional

from app.engine.finance import calculate_capital_cost, simple_payback_years
from app.engine.scenario import evaluate_annual_scenarios
from app.schemas.common import DAY_TYPES
from app.schemas.request import AnalyzeRequest, TariffInput, ToUTariffInput
from app.schemas.response import (
    AnalyzeResponse,
    ForecastMetrics,
    HourlyPoint,
    KPISet,
    RecommendationOption,
    ScenarioComparison,
    SchedulerBenchmarkRow,
    SensitivityRow,
)
from app.services.explanation_service import build_explanations
from app.services.recommendation_service import generate_recommendations


try:
    from app.ml.predict import build_forecast_profiles
    from app.ml.train import train_forecaster
except Exception:  # pragma: no cover - allows API to run before ML layer is complete
    build_forecast_profiles = None
    train_forecaster = None


ASSUMPTIONS = [
    "Building-level economic model only; no power-flow, voltage, or protection analysis.",
    "Hourly time-step with 6 weighted representative day types totaling 365 days.",
    "Battery constrained to 10-90% SOC, 90% round-trip efficiency, and 1C max power.",
    "Solar generation is synthetic with seasonal irradiance, cloud attenuation, and 87% derating.",
    "Battery charges from on-site solar surplus and discharges to serve local load deficits.",
    "No battery degradation is included in the base payback estimate.",
]


def _safe_forecast_bundle(request: AnalyzeRequest) -> tuple[Optional[Dict[str, List[float]]], Optional[ForecastMetrics]]:
    if train_forecaster is None or build_forecast_profiles is None:
        return None, None

    training_result = train_forecaster(request.building.preset_id, request.building.monthly_kwh)
    forecast_profiles = build_forecast_profiles(
        model=training_result["model"],
        preset_id=request.building.preset_id,
        monthly_kwh=request.building.monthly_kwh,
        day_types=DAY_TYPES,
    )
    metrics = training_result["metrics"]
    return forecast_profiles, ForecastMetrics(rmse_kw=metrics["rmse_kw"], mae_kw=metrics["mae_kw"])


def _kpi_from_annual_results(
    annual_grid_only: Dict[str, float],
    annual_solar_battery: Dict[str, float],
    request: AnalyzeRequest,
    solar_kw: float,
    battery_kwh: float,
) -> KPISet:
    annual_savings = annual_grid_only["bill_inr"] - annual_solar_battery["bill_inr"]
    capital_cost = calculate_capital_cost(
        solar_kw=solar_kw,
        battery_kwh=battery_kwh,
        solar_capex_inr_per_kw=request.system_constraints.solar_capex_inr_per_kw,
        battery_capex_inr_per_kwh=request.system_constraints.battery_capex_inr_per_kwh,
    )
    payback = simple_payback_years(capital_cost, annual_savings)

    peak_reduction = 0.0
    if annual_grid_only["peak_grid_import_kw"] > 0:
        peak_reduction = (
            (annual_grid_only["peak_grid_import_kw"] - annual_solar_battery["peak_grid_import_kw"])
            / annual_grid_only["peak_grid_import_kw"]
        ) * 100

    import_reduction = 0.0
    if annual_grid_only["grid_import_kwh"] > 0:
        import_reduction = (
            (annual_grid_only["grid_import_kwh"] - annual_solar_battery["grid_import_kwh"])
            / annual_grid_only["grid_import_kwh"]
        ) * 100

    savings_pct = (annual_savings / annual_grid_only["bill_inr"]) * 100 if annual_grid_only["bill_inr"] > 0 else 0.0
    solar_self_consumption_pct = (
        annual_solar_battery["solar_self_consumed_kwh"] / annual_solar_battery["solar_generation_kwh"] * 100
        if annual_solar_battery["solar_generation_kwh"] > 0
        else 0.0
    )
    cycles = (
        annual_solar_battery["battery_throughput_kwh"] / battery_kwh if battery_kwh > 0 else 0.0
    )

    return KPISet(
        annual_bill_inr=round(annual_solar_battery["bill_inr"], 3),
        annual_savings_inr=round(annual_savings, 3),
        savings_pct=round(savings_pct, 3),
        simple_payback_years=payback,
        peak_demand_reduction_pct=round(peak_reduction, 3),
        grid_import_reduction_pct=round(import_reduction, 3),
        solar_self_consumption_pct=round(solar_self_consumption_pct, 3),
        battery_utilization_cycles_per_year=round(cycles, 3),
        renewable_fraction_pct=round(annual_solar_battery["renewable_fraction_pct"] / 365.0, 3),
        annual_grid_import_kwh=round(annual_solar_battery["grid_import_kwh"], 3),
        annual_grid_export_kwh=round(annual_solar_battery["grid_export_kwh"], 3),
        annual_solar_generation_kwh=round(annual_solar_battery["solar_generation_kwh"], 3),
        annual_load_kwh=round(annual_solar_battery["load_kwh"], 3),
    )


def _scenario_comparison_payload(annual_results: Dict[str, Dict[str, float]]) -> Dict[str, ScenarioComparison]:
    payload: Dict[str, ScenarioComparison] = {}
    for scenario_name, metrics in annual_results.items():
        payload[scenario_name] = ScenarioComparison(
            annual_bill_inr=round(metrics["bill_inr"], 3),
            annual_grid_import_kwh=round(metrics["grid_import_kwh"], 3),
            peak_grid_import_kw=round(metrics["peak_grid_import_kw"], 3),
            renewable_fraction_pct=round(metrics["renewable_fraction_pct"] / 365.0, 3),
        )
    return payload


def _hourly_series_payload(representative_day_results: Dict[str, Dict[str, object]]) -> List[HourlyPoint]:
    baseline = representative_day_results["grid_only"]["hourly"]
    optimized = representative_day_results["solar_battery"]["hourly"]
    points: List[HourlyPoint] = []
    for hour in range(24):
        points.append(
            HourlyPoint(
                hour=hour,
                load_kw=baseline["load_kwh"][hour],
                solar_kw=optimized["solar_kwh"][hour],
                battery_charge_kw=optimized["battery_charge_kwh"][hour],
                battery_discharge_kw=optimized["battery_discharge_kwh"][hour],
                soc_kwh=optimized["soc_kwh"][hour],
                grid_import_kw=optimized["grid_import_kwh"][hour],
                grid_export_kw=optimized["grid_export_kwh"][hour],
                baseline_grid_kw=baseline["grid_import_kwh"][hour],
            )
        )
    return points


def _scheduler_benchmark(
    request: AnalyzeRequest,
    solar_kw: float,
    battery_kwh: float,
    forecast_profiles: Optional[Dict[str, List[float]]] = None,
) -> List[SchedulerBenchmarkRow]:
    benchmark_rows: List[SchedulerBenchmarkRow] = []
    for mode in ("greedy", "rule_based", "forecast_assisted"):
        benchmark_request = request.model_copy(deep=True)
        benchmark_request.analysis.scheduler_mode = mode
        mode_forecasts = forecast_profiles if mode == "forecast_assisted" else None
        evaluation = evaluate_annual_scenarios(
            preset_id=benchmark_request.building.preset_id,
            monthly_kwh=benchmark_request.building.monthly_kwh,
            location=benchmark_request.building.location,
            tariff=benchmark_request.tariff,
            solar_kw=solar_kw,
            battery_kwh=battery_kwh,
            scheduler_mode=benchmark_request.analysis.scheduler_mode,
            forecast_by_day_type=mode_forecasts,
        )
        annual_grid_only = evaluation["annual_results"]["grid_only"]
        annual_solar_battery = evaluation["annual_results"]["solar_battery"]
        peak_reduction = 0.0
        import_reduction = 0.0
        if annual_grid_only["peak_grid_import_kw"] > 0:
            peak_reduction = (
                (annual_grid_only["peak_grid_import_kw"] - annual_solar_battery["peak_grid_import_kw"])
                / annual_grid_only["peak_grid_import_kw"]
            ) * 100
        if annual_grid_only["grid_import_kwh"] > 0:
            import_reduction = (
                (annual_grid_only["grid_import_kwh"] - annual_solar_battery["grid_import_kwh"])
                / annual_grid_only["grid_import_kwh"]
            ) * 100
        benchmark_rows.append(
            SchedulerBenchmarkRow(
                mode=mode,
                annual_bill_inr=round(annual_solar_battery["bill_inr"], 3),
                peak_demand_reduction_pct=round(peak_reduction, 3),
                grid_import_reduction_pct=round(import_reduction, 3),
            )
        )
    return benchmark_rows


def _sensitivity_analysis(request: AnalyzeRequest, solar_kw: float, battery_kwh: float) -> List[SensitivityRow]:
    cases = [
        ("Low solar, flat tariff", 0.30, request.tariff.model_copy(update={"type": "flat", "flat_rate_inr_per_kwh": 7.0, "tou": None})),
        ("Normal solar, flat tariff", 0.20, request.tariff.model_copy(update={"type": "flat", "flat_rate_inr_per_kwh": 7.0, "tou": None})),
        ("High solar, flat tariff", 0.10, request.tariff.model_copy(update={"type": "flat", "flat_rate_inr_per_kwh": 7.0, "tou": None})),
        ("Normal solar, ToU tariff", 0.20, request.tariff.model_copy(update={"type": "tou", "tou": request.tariff.tou or ToUTariffInput()})),
    ]

    rows: List[SensitivityRow] = []
    for label, cloudiness, tariff in cases:
        cloudiness_by_day_type = {day_type: cloudiness for day_type in DAY_TYPES}
        evaluation = evaluate_annual_scenarios(
            preset_id=request.building.preset_id,
            monthly_kwh=request.building.monthly_kwh,
            location=request.building.location,
            tariff=tariff,
            solar_kw=solar_kw,
            battery_kwh=battery_kwh,
            scheduler_mode=request.analysis.scheduler_mode,
            cloudiness_by_day_type=cloudiness_by_day_type,
        )
        annual_grid_only = evaluation["annual_results"]["grid_only"]
        annual_solar_battery = evaluation["annual_results"]["solar_battery"]
        annual_savings = annual_grid_only["bill_inr"] - annual_solar_battery["bill_inr"]
        payback = simple_payback_years(
            calculate_capital_cost(
                solar_kw=solar_kw,
                battery_kwh=battery_kwh,
                solar_capex_inr_per_kw=request.system_constraints.solar_capex_inr_per_kw,
                battery_capex_inr_per_kwh=request.system_constraints.battery_capex_inr_per_kwh,
            ),
            annual_savings,
        )
        rows.append(
            SensitivityRow(
                label=label,
                annual_bill_inr=round(annual_solar_battery["bill_inr"], 3),
                annual_savings_inr=round(annual_savings, 3),
                savings_pct=round((annual_savings / annual_grid_only["bill_inr"]) * 100 if annual_grid_only["bill_inr"] else 0.0, 3),
                simple_payback_years=payback,
            )
        )
    return rows


def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    forecast_profiles, forecast_metrics = _safe_forecast_bundle(request)
    recommendation_bundle = generate_recommendations(
        request,
        forecast_by_day_type=forecast_profiles if request.analysis.scheduler_mode == "forecast_assisted" else None,
    )
    recommendation = recommendation_bundle["best_balanced"]
    evaluation = recommendation["evaluation"]
    annual_results = evaluation["annual_results"]
    representative_day_type = request.analysis.representative_day_type
    representative_day_results = evaluation["daily_results"][representative_day_type]

    annual_grid_only = annual_results["grid_only"]
    annual_solar_only = annual_results["solar_only"]
    annual_solar_battery = annual_results["solar_battery"]

    explanations = build_explanations(
        recommendation=recommendation,
        annual_grid_only=annual_grid_only,
        annual_solar_only=annual_solar_only,
        annual_solar_battery=annual_solar_battery,
    )
    kpis = _kpi_from_annual_results(
        annual_grid_only=annual_grid_only,
        annual_solar_battery=annual_solar_battery,
        request=request,
        solar_kw=float(recommendation["solar_kw"]),
        battery_kwh=float(recommendation["battery_kwh"]),
    )

    def option_payload(option: Optional[Dict[str, float | None]]) -> Optional[RecommendationOption]:
        if option is None:
            return None
        return RecommendationOption(
            solar_kw=float(option["solar_kw"]),
            battery_kwh=float(option["battery_kwh"]),
            annual_savings_inr=float(option["annual_savings_inr"]),
            simple_payback_years=option["simple_payback_years"],
            peak_demand_reduction_pct=float(option["peak_demand_reduction_pct"]),
            grid_import_reduction_pct=float(option["grid_import_reduction_pct"]),
            score=float(option["score"]),
        )

    return AnalyzeResponse(
        recommendation=option_payload(recommendation),
        best_by_payback=option_payload(recommendation_bundle["best_by_payback"]),
        best_by_savings=option_payload(recommendation_bundle["best_by_savings"]),
        explanations=explanations,
        kpis=kpis,
        representative_day_type=representative_day_type,
        hourly_series=_hourly_series_payload(representative_day_results),
        scenario_comparison=_scenario_comparison_payload(annual_results),
        scheduler_benchmark=_scheduler_benchmark(
            request=request,
            solar_kw=float(recommendation["solar_kw"]),
            battery_kwh=float(recommendation["battery_kwh"]),
            forecast_profiles=forecast_profiles,
        ),
        forecast_metrics=forecast_metrics,
        sensitivity=_sensitivity_analysis(
            request=request,
            solar_kw=float(recommendation["solar_kw"]),
            battery_kwh=float(recommendation["battery_kwh"]),
        ),
        assumptions=ASSUMPTIONS,
    )
