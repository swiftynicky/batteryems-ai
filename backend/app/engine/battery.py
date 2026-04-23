from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class BatteryModel:
    capacity_kwh: float
    min_soc_pct: float = 0.10
    max_soc_pct: float = 0.90
    round_trip_efficiency: float = 0.90
    max_c_rate: float = 1.0
    initial_soc_pct: float = 0.10

    def __post_init__(self) -> None:
        self.charge_efficiency = self.round_trip_efficiency ** 0.5
        self.discharge_efficiency = self.round_trip_efficiency ** 0.5
        self.min_soc_kwh = self.capacity_kwh * self.min_soc_pct
        self.max_soc_kwh = self.capacity_kwh * self.max_soc_pct
        self.max_power_kw = self.capacity_kwh * self.max_c_rate
        if self.capacity_kwh <= 0:
            self.soc_kwh = 0.0
            self.min_soc_kwh = 0.0
            self.max_soc_kwh = 0.0
            self.max_power_kw = 0.0
        else:
            starting_soc = self.capacity_kwh * self.initial_soc_pct
            self.soc_kwh = min(max(starting_soc, self.min_soc_kwh), self.max_soc_kwh)
        self.throughput_kwh = 0.0

    def charge_from_surplus(self, surplus_kwh: float) -> float:
        if self.capacity_kwh <= 0 or surplus_kwh <= 0:
            return 0.0
        remaining_capacity = max(self.max_soc_kwh - self.soc_kwh, 0.0)
        max_input = min(self.max_power_kw, surplus_kwh, remaining_capacity / self.charge_efficiency)
        self.soc_kwh += max_input * self.charge_efficiency
        self.throughput_kwh += max_input
        return max_input

    def discharge_to_load(self, desired_output_kwh: float) -> float:
        if self.capacity_kwh <= 0 or desired_output_kwh <= 0:
            return 0.0
        available_energy = max(self.soc_kwh - self.min_soc_kwh, 0.0)
        max_deliverable = min(self.max_power_kw, available_energy * self.discharge_efficiency)
        delivered = min(desired_output_kwh, max_deliverable)
        self.soc_kwh -= delivered / self.discharge_efficiency
        self.throughput_kwh += delivered
        return delivered

    def snapshot(self) -> Dict[str, float]:
        return {
            "soc_kwh": round(self.soc_kwh, 3),
            "soc_pct": round((self.soc_kwh / self.capacity_kwh) * 100, 2) if self.capacity_kwh else 0.0,
            "throughput_kwh": round(self.throughput_kwh, 3),
        }
