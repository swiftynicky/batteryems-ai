from __future__ import annotations

from fastapi import FastAPI

from app.api.analyze import router as analyze_router
from app.api.presets import router as presets_router


app = FastAPI(
    title="BatteryEMS AI Backend",
    version="0.1.0",
    summary="Solar and battery planning advisor for building energy management",
)

app.include_router(presets_router)
app.include_router(analyze_router)


@app.get("/health")
def healthcheck() -> dict:
    return {"status": "ok"}
