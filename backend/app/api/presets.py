from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter


router = APIRouter(tags=["presets"])

PRESETS_PATH = Path(__file__).resolve().parents[1] / "data" / "presets.json"


@router.get("/api/presets")
def get_presets() -> dict:
    with PRESETS_PATH.open("r", encoding="utf-8") as handle:
        presets = json.load(handle)
    return {"presets": presets}
