from __future__ import annotations

from typing import Dict, List, Optional


def build_explanations(
    recommendation: Dict[str, float | None],
    annual_grid_only: Dict[str, float],
    annual_solar_only: Dict[str, float],
    annual_solar_battery: Dict[str, float],
) -> List[str]:
    savings = float(recommendation["annual_savings_inr"])
    payback = recommendation["simple_payback_years"]
    solar_kw = float(recommendation["solar_kw"])
    battery_kwh = float(recommendation["battery_kwh"])

    solar_only_savings = annual_grid_only["bill_inr"] - annual_solar_only["bill_inr"]
    battery_incremental_savings = annual_solar_only["bill_inr"] - annual_solar_battery["bill_inr"]
    peak_reduction = float(recommendation["peak_demand_reduction_pct"])
    import_reduction = float(recommendation["grid_import_reduction_pct"])
    self_consumption = annual_solar_battery["solar_self_consumed_kwh"] / max(annual_solar_battery["solar_generation_kwh"], 1e-6) * 100

    statements = [
        f"A {solar_kw:.0f} kW solar system with a {battery_kwh:.0f} kWh battery reduces the annual bill by about INR {savings:,.0f} compared with grid-only operation.",
        f"Solar alone captures roughly INR {solar_only_savings:,.0f} of the total savings, while battery scheduling adds another INR {battery_incremental_savings:,.0f} by shifting surplus energy into high-value hours.",
        f"The recommended system cuts peak grid demand by {peak_reduction:.1f}% and annual grid imports by {import_reduction:.1f}%, which directly supports peak-shaving and bill reduction.",
        f"Estimated solar self-consumption is {self_consumption:.1f}%, so most PV generation is used on-site instead of being exported at the lower feed-in rate.",
    ]

    if payback is not None:
        statements.append(f"At the assumed capex rates, the simple payback is about {payback:.1f} years.")
    else:
        statements.append("Under the current tariff and cost assumptions, this configuration does not achieve a finite simple payback.")

    return statements
