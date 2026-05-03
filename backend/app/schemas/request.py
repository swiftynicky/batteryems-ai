from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.common import ObjectiveType, SchedulerMode, TariffType


class BuildingInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    preset_id: str = Field(default="apartment_society")
    monthly_kwh: float = Field(default=12000, gt=0)
    roof_area_sqm: float = Field(default=450, gt=0)
    location: Literal["Kochi", "Bengaluru", "Chennai"] = Field(default="Kochi")
    load_source: str = Field(default="synthetic")


class ToUTariffInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    off_peak_rate_inr_per_kwh: float = Field(default=5.0, ge=0)
    standard_rate_inr_per_kwh: float = Field(default=7.0, ge=0)
    peak_rate_inr_per_kwh: float = Field(default=9.0, ge=0)
    peak_start_hour: int = Field(default=17, ge=0, le=23)
    peak_end_hour: int = Field(default=21, ge=0, le=23)

    @model_validator(mode="after")
    def validate_peak_window(self) -> "ToUTariffInput":
        if self.peak_end_hour < self.peak_start_hour:
            raise ValueError("peak_end_hour must be greater than or equal to peak_start_hour")
        return self


class TariffInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: TariffType = "flat"
    flat_rate_inr_per_kwh: float = Field(default=7.0, ge=0)
    tou: Optional[ToUTariffInput] = None
    feed_in_rate_inr_per_kwh: float = Field(default=2.5, ge=0)

    @model_validator(mode="after")
    def validate_tariff_shape(self) -> "TariffInput":
        if self.type == "tou" and self.tou is None:
            self.tou = ToUTariffInput()
        return self


class SystemConstraintsInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    max_solar_kw: float = Field(default=50, ge=0)
    max_battery_kwh: float = Field(default=40, ge=0)
    solar_capex_inr_per_kw: float = Field(default=34000, ge=0)
    battery_capex_inr_per_kwh: float = Field(default=9000, ge=0)


class AnalysisInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    candidate_solar_kw: List[float] = Field(default_factory=lambda: [0, 10, 20, 30, 40, 50])
    candidate_battery_kwh: List[float] = Field(default_factory=lambda: [0, 10, 20, 30, 40])
    objective: ObjectiveType = "balanced"
    scheduler_mode: SchedulerMode = "rule_based"
    representative_day_type: str = "summer_weekday"

    @model_validator(mode="after")
    def normalize_candidates(self) -> "AnalysisInput":
        self.candidate_solar_kw = sorted({float(value) for value in self.candidate_solar_kw})
        self.candidate_battery_kwh = sorted({float(value) for value in self.candidate_battery_kwh})
        if not self.candidate_solar_kw:
            raise ValueError("candidate_solar_kw cannot be empty")
        if not self.candidate_battery_kwh:
            raise ValueError("candidate_battery_kwh cannot be empty")
        return self


class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    building: BuildingInput = Field(default_factory=BuildingInput)
    tariff: TariffInput = Field(default_factory=TariffInput)
    system_constraints: SystemConstraintsInput = Field(default_factory=SystemConstraintsInput)
    analysis: AnalysisInput = Field(default_factory=AnalysisInput)
