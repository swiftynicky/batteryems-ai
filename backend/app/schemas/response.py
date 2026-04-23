from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class KPISet(BaseModel):
    model_config = ConfigDict(extra="forbid")

    annual_bill_inr: float
    annual_savings_inr: float
    savings_pct: float
    simple_payback_years: Optional[float]
    peak_demand_reduction_pct: float
    grid_import_reduction_pct: float
    solar_self_consumption_pct: float
    battery_utilization_cycles_per_year: float
    renewable_fraction_pct: float
    annual_grid_import_kwh: float
    annual_grid_export_kwh: float
    annual_solar_generation_kwh: float
    annual_load_kwh: float


class ScenarioComparison(BaseModel):
    model_config = ConfigDict(extra="forbid")

    annual_bill_inr: float
    annual_grid_import_kwh: float
    peak_grid_import_kw: float
    renewable_fraction_pct: float


class HourlyPoint(BaseModel):
    model_config = ConfigDict(extra="forbid")

    hour: int
    load_kw: float
    solar_kw: float
    battery_charge_kw: float
    battery_discharge_kw: float
    soc_kwh: float
    grid_import_kw: float
    grid_export_kw: float
    baseline_grid_kw: float


class RecommendationOption(BaseModel):
    model_config = ConfigDict(extra="forbid")

    solar_kw: float
    battery_kwh: float
    annual_savings_inr: float
    simple_payback_years: Optional[float]
    peak_demand_reduction_pct: float
    grid_import_reduction_pct: float
    score: float


class SchedulerBenchmarkRow(BaseModel):
    model_config = ConfigDict(extra="forbid")

    mode: str
    annual_bill_inr: float
    peak_demand_reduction_pct: float
    grid_import_reduction_pct: float


class ForecastMetrics(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rmse_kw: float
    mae_kw: float


class SensitivityRow(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str
    annual_bill_inr: float
    annual_savings_inr: float
    savings_pct: float
    simple_payback_years: Optional[float]


class AnalyzeResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    recommendation: RecommendationOption
    best_by_payback: Optional[RecommendationOption]
    best_by_savings: Optional[RecommendationOption]
    explanations: List[str]
    kpis: KPISet
    representative_day_type: str
    hourly_series: List[HourlyPoint]
    scenario_comparison: Dict[str, ScenarioComparison]
    scheduler_benchmark: List[SchedulerBenchmarkRow]
    forecast_metrics: Optional[ForecastMetrics] = None
    sensitivity: List[SensitivityRow] = Field(default_factory=list)
    assumptions: List[str]
