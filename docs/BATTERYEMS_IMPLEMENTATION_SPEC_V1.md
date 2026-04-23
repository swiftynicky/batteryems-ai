# BatteryEMS AI Implementation Spec v1

> Project: EE3094E Minor Project
> Date: 20 April 2026
> Workspace: D:\Timeless\Academics\batteryems-ai
> Status: Greenfield implementation spec

## 1. Product Definition

**Title:** BatteryEMS AI: Solar + Battery Planning and Scheduling Advisor for Buildings

**Primary user:** Apartment society manager, small commercial facility manager, solar EPC consultant

**Core job-to-be-done:** Help a building decision-maker estimate whether solar and battery storage are worth installing, what sizes are reasonable, and how battery scheduling changes cost, peak demand, and grid dependence.

**Viva framing:** This is a building-level energy management and investment decision-support tool, not a power-flow simulator and not a real-time controller.

## 2. Greenfield Workspace Structure

```text
batteryems-ai/
├── README.md
├── docs/
│   └── BATTERYEMS_IMPLEMENTATION_SPEC_V1.md
├── data/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── analyze.py
│   │   │   └── presets.py
│   │   ├── schemas/
│   │   │   ├── common.py
│   │   │   ├── request.py
│   │   │   └── response.py
│   │   ├── services/
│   │   │   ├── analyze_service.py
│   │   │   ├── explanation_service.py
│   │   │   └── recommendation_service.py
│   │   ├── engine/
│   │   │   ├── annualize.py
│   │   │   ├── battery.py
│   │   │   ├── finance.py
│   │   │   ├── load.py
│   │   │   ├── metrics.py
│   │   │   ├── scenario.py
│   │   │   ├── scheduler.py
│   │   │   ├── solar.py
│   │   │   └── tariff.py
│   │   ├── ml/
│   │   │   ├── dataset.py
│   │   │   ├── features.py
│   │   │   ├── predict.py
│   │   │   └── train.py
│   │   └── data/
│   │       ├── presets.json
│   │       └── sample_loads/
│   ├── scripts/
│   │   ├── benchmark_scheduler.py
│   │   ├── generate_synthetic_dataset.py
│   │   └── run_analysis.py
│   └── requirements.txt
└── frontend/
    └── src/
        ├── app/
        ├── components/
        │   ├── charts/
        │   ├── inputs/
        │   ├── results/
        │   └── ui/
        ├── lib/
        ├── store/
        └── types/
```

## 3. Final Scope

### In scope

- Building preset or custom input
- Optional CSV upload for hourly load data
- Synthetic load generation when CSV is not provided
- Synthetic solar generation with location/profile assumptions
- Three scenario evaluation:
  - Grid only
  - Solar only
  - Solar + Battery
- Candidate-size search for recommendation
- Rule-based and forecast-assisted battery scheduling
- Annualized cost and savings estimates
- Before/after charts and explanation panel

### Out of scope

- Power flow, voltage, frequency, reactive power
- Protection, relay coordination, fault analysis
- Real-time device control
- Multi-building market trading
- Detailed battery degradation modeling
- Large language model chatbot as core product

## 4. Product Promise

The tool must do both:

1. Evaluate a user-specified solar and battery combination
2. Recommend a better solar and battery combination from a bounded search space

If the tool does not search and recommend, it is only a calculator. The recommendation layer is mandatory.

## 5. Core User Flow

1. User selects building preset or uploads hourly load CSV
2. User enters tariff, location/profile, solar budget range, battery budget range
3. User clicks `Analyze`
4. Backend generates representative scenarios and annualizes them
5. Backend evaluates candidate system sizes
6. Backend returns:
   - best recommendation
   - top alternatives
   - scenario comparison
   - hourly representative curves
   - KPI summary
   - explanation text inputs
7. Frontend renders recommendation, charts, and scenario comparison

## 6. Engineering Assumptions

```text
1. Building-level energy management model only
2. No voltage, frequency, reactive power, or feeder congestion modeling
3. Battery modeled with SOC bounds, efficiency, and max charge/discharge power
4. Solar generation is synthetic or CSV-assisted, not live SCADA data
5. Load is synthetic when CSV is not provided
6. User-selectable flat or time-of-use tariff
7. Feed-in/export compensation is configurable
8. Hourly scheduling time-step
9. Annual results are derived from weighted representative day types, not a single day x 365
10. Degradation is excluded from the base model and listed as a limitation
```

## 7. Annualization Method

Do not multiply one synthetic day by 365.

Use representative day types:

- `summer_weekday`
- `summer_weekend`
- `monsoon_weekday`
- `monsoon_weekend`
- `winter_weekday`
- `winter_weekend`

Suggested annual weights:

| Day Type | Count |
| --- | ---: |
| summer_weekday | 88 |
| summer_weekend | 26 |
| monsoon_weekday | 88 |
| monsoon_weekend | 26 |
| winter_weekday | 103 |
| winter_weekend | 34 |

All annual financial KPIs must be computed from weighted sums across these day types.

## 8. Recommendation Logic

Recommendation uses a bounded grid search.

Default candidate sets:

- Solar size candidates in kW: `0, 10, 20, 30, 40, 50`
- Battery size candidates in kWh: `0, 10, 20, 30, 40`

Search rules:

- reject candidates above user roof or budget limits
- reject infeasible battery power assumptions
- evaluate each valid `(solar_kw, battery_kwh)` pair across representative day types
- return:
  - `best_by_payback`
  - `best_by_savings`
  - `best_balanced`

Balanced score:

```text
score =
  0.45 * normalized_annual_savings +
  0.25 * normalized_peak_reduction +
  0.20 * normalized_grid_import_reduction -
  0.10 * normalized_payback_years
```

## 9. KPI Definitions

| KPI | Definition |
| --- | --- |
| `annual_bill_inr` | Annual grid import cost minus export credit |
| `annual_savings_inr` | `grid_only_annual_bill - selected_scenario_annual_bill` |
| `savings_pct` | `(annual_savings_inr / grid_only_annual_bill) * 100` |
| `simple_payback_years` | `capital_cost_inr / annual_savings_inr`, if savings > 0 |
| `peak_demand_reduction_pct` | Reduction in max hourly grid import relative to grid-only |
| `grid_import_reduction_pct` | Reduction in annual imported kWh relative to grid-only |
| `solar_self_consumption_pct` | `(locally_used_solar_kwh / total_solar_generated_kwh) * 100` |
| `battery_utilization_cycles_per_year` | `annual_battery_throughput_kwh / battery_capacity_kwh` |
| `renewable_fraction_pct` | Portion of load served directly or indirectly by solar |

## 10. API Contract

### `GET /api/presets`

Returns building presets and default tariff/cost assumptions.

### `POST /api/analyze`

Initial request shape:

```json
{
  "building": {
    "preset_id": "apartment_society",
    "monthly_kwh": 12000,
    "roof_area_sqm": 450,
    "location": "Kochi",
    "load_source": "synthetic"
  },
  "tariff": {
    "type": "flat",
    "flat_rate_inr_per_kwh": 7.0,
    "tou": null,
    "feed_in_rate_inr_per_kwh": 2.5
  },
  "system_constraints": {
    "max_solar_kw": 50,
    "max_battery_kwh": 40,
    "solar_capex_inr_per_kw": 50000,
    "battery_capex_inr_per_kwh": 15000
  },
  "analysis": {
    "candidate_solar_kw": [0, 10, 20, 30, 40, 50],
    "candidate_battery_kwh": [0, 10, 20, 30, 40],
    "objective": "balanced",
    "scheduler_mode": "forecast_assisted"
  }
}
```

## 11. Scheduler Modes

Implement three modes:

1. `greedy`
2. `rule_based`
3. `forecast_assisted`

The report should compare `rule_based` vs `forecast_assisted`.

## 12. ML Scope

Keep the ML modest and defensible.

- Model: `DecisionTreeRegressor` or `LinearRegression`
- Features:
  - hour of day
  - weekday/weekend
  - previous hour load
  - rolling mean over last 4 hours
  - seasonal bucket
- Target:
  - next-hour load
- Validation:
  - generate 50 synthetic days
  - train on 40, test on 10
  - report RMSE and MAE

Correct claim:

**“We evaluated whether forecast-assisted scheduling improved cost and peak reduction relative to rule-based control.”**

## 13. Frontend MVP

Must-have:

- input form
- preset selector
- results hero cards
- daily energy curve
- battery SOC curve
- scenario comparison bars
- recommendation card

Should-have:

- explanation panel
- sensitivity summary
- CSV upload UI

## 14. Demo Case

Primary demo case:

- 100-unit apartment society
- monthly_kwh = 12000
- roof_area = 450 sqm
- flat tariff = INR 7/kWh
- feed-in = INR 2.5/kWh

Demo flow:

1. Select preset
2. Click analyze
3. Show recommendation
4. Show annual bill comparison
5. Show midday charging and evening discharge
6. Show payback and peak reduction
7. Briefly show forecast benchmark

## 15. Acceptance Criteria

The project is acceptable for submission when all of the below are true:

- `POST /api/analyze` returns a valid recommendation and scenario comparison
- recommendation is generated from candidate search, not hardcoded
- annual results are based on weighted representative day types
- frontend renders one complete end-to-end analysis
- scheduler comparison exists with documented forecast metrics
- assumptions and limitations are explicit
- one clean demo case has stable outputs

## 16. Immediate Next Build Tasks

1. Implement backend engine modules:
   - `backend/app/engine/load.py`
   - `backend/app/engine/solar.py`
   - `backend/app/engine/battery.py`
   - `backend/app/engine/tariff.py`
2. Add `backend/scripts/run_analysis.py`
3. Define `backend/app/schemas/request.py` and `response.py`
4. Wire `GET /api/presets` and `POST /api/analyze`
5. Start frontend only after the analysis response shape is stable
