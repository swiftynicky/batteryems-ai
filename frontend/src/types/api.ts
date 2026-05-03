// ─── API Types for BatteryEMS AI ───

export interface BuildingPreset {
  id: string;
  name: string;
  description: string;
  monthly_kwh: number;
  roof_area_sqm: number;
  location: string;
  suggested_max_solar_kw: number;
  suggested_max_battery_kwh: number;
}

export interface TariffDefaults {
  type: 'flat' | 'tou';
  flat_rate_inr_per_kwh: number;
  feed_in_rate_inr_per_kwh: number;
}

export interface CostDefaults {
  solar_capex_inr_per_kw: number;
  battery_capex_inr_per_kwh: number;
}

export interface PresetsResponse {
  building_presets: BuildingPreset[];
  defaults: {
    tariff: TariffDefaults;
    costs: CostDefaults;
  };
}

export interface TOUConfig {
  off_peak_rate_inr_per_kwh: number;
  standard_rate_inr_per_kwh: number;
  peak_rate_inr_per_kwh: number;
  peak_start_hour: number;
  peak_end_hour: number;
}

// ─── Analyze Request ───

export interface AnalyzeRequest {
  building: {
    preset_id: string;
    monthly_kwh: number;
    roof_area_sqm: number;
    location: string;
    load_source: string;
  };
  tariff: {
    type: 'flat' | 'tou';
    flat_rate_inr_per_kwh: number;
    tou: TOUConfig | null;
    feed_in_rate_inr_per_kwh: number;
  };
  system_constraints: {
    max_solar_kw: number;
    max_battery_kwh: number;
    solar_capex_inr_per_kw: number;
    battery_capex_inr_per_kwh: number;
  };
  analysis: {
    candidate_solar_kw: number[];
    candidate_battery_kwh: number[];
    objective: string;
    scheduler_mode: string;
    representative_day_type: string;
  };
}

// ─── Analyze Response ───

export interface RecommendationOption {
  solar_kw: number;
  battery_kwh: number;
  annual_savings_inr: number;
  simple_payback_years: number | null;
  peak_demand_reduction_pct: number;
  grid_import_reduction_pct: number;
  score: number;
}

export interface KPISet {
  annual_bill_inr: number;
  annual_savings_inr: number;
  savings_pct: number;
  simple_payback_years: number | null;
  peak_demand_reduction_pct: number;
  grid_import_reduction_pct: number;
  solar_self_consumption_pct: number;
  battery_utilization_cycles_per_year: number;
  renewable_fraction_pct: number;
  annual_grid_import_kwh: number;
  annual_grid_export_kwh: number;
  annual_solar_generation_kwh: number;
  annual_load_kwh: number;
}

export interface HourlyPoint {
  hour: number;
  load_kw: number;
  solar_kw: number;
  battery_charge_kw: number;
  battery_discharge_kw: number;
  soc_kwh: number;
  grid_import_kw: number;
  grid_export_kw: number;
  baseline_grid_kw: number;
}

export interface ScenarioMetrics {
  annual_bill_inr: number;
  annual_grid_import_kwh: number;
  peak_grid_import_kw: number;
  renewable_fraction_pct: number;
}

export interface ScenarioComparison {
  grid_only: ScenarioMetrics;
  solar_only: ScenarioMetrics;
  solar_battery: ScenarioMetrics;
}

export interface SchedulerBenchmark {
  mode: string;
  annual_bill_inr: number;
  peak_demand_reduction_pct: number;
  grid_import_reduction_pct: number;
}

export interface SensitivityRow {
  label: string;
  annual_bill_inr: number;
  annual_savings_inr: number;
  savings_pct: number;
  simple_payback_years: number | null;
}

export interface ForecastMetrics {
  rmse_kw: number;
  mae_kw: number;
}

export interface AnalyzeResponse {
  recommendation: RecommendationOption;
  best_by_payback: RecommendationOption | null;
  best_by_savings: RecommendationOption;
  explanations: string[];
  kpis: KPISet;
  representative_day_type: string;
  hourly_series: HourlyPoint[];
  scenario_comparison: ScenarioComparison;
  scheduler_benchmark: SchedulerBenchmark[];
  forecast_metrics: ForecastMetrics | null;
  sensitivity: SensitivityRow[];
  assumptions: string[];
}
