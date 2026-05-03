"""
Smoke tests for BatteryEMS AI backend API.

Run from the backend/ directory:
    python -m pytest tests/test_api_smoke.py -v
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.engine.tariff import get_import_rate
from app.main import app
from app.schemas.request import TariffInput, ToUTariffInput

client = TestClient(app)


# ---------------------------------------------------------------------------
# /health
# ---------------------------------------------------------------------------

def test_health_returns_200():
    response = client.get("/health")
    assert response.status_code == 200


def test_health_body():
    response = client.get("/health")
    assert response.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# /api/presets
# ---------------------------------------------------------------------------

def test_presets_returns_200():
    response = client.get("/api/presets")
    assert response.status_code == 200


def test_presets_has_building_presets_and_defaults():
    response = client.get("/api/presets")
    data = response.json()
    assert "building_presets" in data, "Response missing 'building_presets'"
    assert "defaults" in data, "Response missing 'defaults'"


# ---------------------------------------------------------------------------
# /api/analyze  (empty JSON → all defaults)
# ---------------------------------------------------------------------------

REQUIRED_TOP_KEYS = [
    "recommendation",
    "kpis",
    "hourly_series",
    "scenario_comparison",
    "scheduler_benchmark",
    "forecast_metrics",
    "sensitivity",
]


def test_analyze_empty_json_returns_200():
    response = client.post("/api/analyze", json={})
    assert response.status_code == 200, response.text


def test_analyze_response_has_required_keys():
    response = client.post("/api/analyze", json={})
    data = response.json()
    for key in REQUIRED_TOP_KEYS:
        assert key in data, f"Response missing key: '{key}'"


def test_analyze_hourly_series_length_is_24():
    response = client.post("/api/analyze", json={})
    data = response.json()
    assert len(data["hourly_series"]) == 24, (
        f"Expected 24 hourly points, got {len(data['hourly_series'])}"
    )


def test_analyze_location_changes_solar_generation():
    request = {
        "building": {
            "preset_id": "apartment_society",
            "monthly_kwh": 12000,
            "roof_area_sqm": 450,
            "location": "Kochi",
            "load_source": "synthetic",
        },
        "tariff": {
            "type": "flat",
            "flat_rate_inr_per_kwh": 7.0,
            "tou": None,
            "feed_in_rate_inr_per_kwh": 2.5,
        },
        "system_constraints": {
            "max_solar_kw": 50,
            "max_battery_kwh": 40,
            "solar_capex_inr_per_kw": 34000,
            "battery_capex_inr_per_kwh": 9000,
        },
        "analysis": {
            "candidate_solar_kw": [0, 10, 20, 30, 40, 50],
            "candidate_battery_kwh": [0, 10, 20, 30, 40],
            "objective": "balanced",
            "scheduler_mode": "rule_based",
            "representative_day_type": "summer_weekday",
        },
    }

    kochi_response = client.post("/api/analyze", json=request)
    assert kochi_response.status_code == 200, kochi_response.text

    request["building"]["location"] = "Chennai"
    chennai_response = client.post("/api/analyze", json=request)
    assert chennai_response.status_code == 200, chennai_response.text

    kochi_solar = kochi_response.json()["kpis"]["annual_solar_generation_kwh"]
    chennai_solar = chennai_response.json()["kpis"]["annual_solar_generation_kwh"]
    assert chennai_solar > kochi_solar


def test_tou_peak_rate_takes_precedence_over_off_peak_window():
    tariff = TariffInput(
        type="tou",
        tou=ToUTariffInput(
            off_peak_rate_inr_per_kwh=4.5,
            standard_rate_inr_per_kwh=7.0,
            peak_rate_inr_per_kwh=15.0,
            peak_start_hour=18,
            peak_end_hour=22,
        ),
        feed_in_rate_inr_per_kwh=2.5,
    )

    assert get_import_rate(22, tariff) == 15.0
