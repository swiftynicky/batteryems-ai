from __future__ import annotations

from typing import Dict, Optional


def calculate_capital_cost(
    solar_kw: float,
    battery_kwh: float,
    solar_capex_inr_per_kw: float,
    battery_capex_inr_per_kwh: float,
) -> float:
    return round((solar_kw * solar_capex_inr_per_kw) + (battery_kwh * battery_capex_inr_per_kwh), 3)


def simple_payback_years(capital_cost_inr: float, annual_savings_inr: float) -> Optional[float]:
    if annual_savings_inr <= 0:
        return None
    return round(capital_cost_inr / annual_savings_inr, 3)


def five_year_cumulative_savings(annual_savings_inr: float, capital_cost_inr: float) -> Dict[str, float]:
    total = (annual_savings_inr * 5) - capital_cost_inr
    return {
        "gross_savings_inr": round(annual_savings_inr * 5, 3),
        "net_savings_inr": round(total, 3),
    }
