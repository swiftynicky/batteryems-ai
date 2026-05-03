# BatteryEMS AI

BatteryEMS AI is a web-based decision-support system for evaluating solar photovoltaic (PV) and battery energy storage system (BESS) configurations for building-scale electricity consumers. The platform combines synthetic load modelling, location-aware PV estimation, tariff modelling, battery dispatch simulation, and multi-scenario financial analysis to support early-stage energy planning.

The application is intended for comparative feasibility assessment rather than detailed engineering design. It helps estimate how different PV and battery capacities affect annual electricity cost, grid import, peak demand, self-consumption, and simple payback.

## Live Services

| Service | URL |
| --- | --- |
| Frontend Dashboard | [https://batteryems.vercel.app](https://batteryems.vercel.app) |
| Backend API | [https://batteryems-backend.onrender.com](https://batteryems-backend.onrender.com) |

## Objectives

- Estimate building-level solar PV generation and battery dispatch for representative daily demand profiles.
- Compare grid-only, solar-only, and solar-plus-battery operating cases.
- Rank candidate system sizes using financial and operational metrics.
- Support flat-rate and time-of-use electricity tariff assumptions.
- Provide an interactive dashboard for exploring load, generation, battery state of charge, grid import, savings, and sensitivity results.

## System Overview

```text
┌─────────────────────┐       ┌─────────────────────────┐
│   Next.js Frontend  │──────▶│   FastAPI Backend        │
│   Vercel            │  API  │   Render                 │
│                     │       │                          │
│  Dashboard UI       │       │  Load profile engine     │
│  Scenario controls  │       │  Solar generation model  │
│  Recharts visuals   │       │  Battery dispatch model  │
│  Zustand state      │       │  Tariff and finance      │
└─────────────────────┘       │  Scenario optimization   │
                              └─────────────────────────┘
```

## Methodology

BatteryEMS evaluates system performance through a deterministic simulation pipeline:

1. A representative hourly load profile is generated from building type and monthly energy consumption.
2. Solar PV output is estimated from roof area, location, and candidate PV capacity.
3. Battery operation is simulated with state-of-charge limits and charge/discharge constraints.
4. Electricity bills are computed using flat-rate or time-of-use tariffs.
5. Candidate PV and BESS sizes are compared using annualized savings, payback, grid independence, peak reduction, and self-consumption indicators.
6. Sensitivity cases are generated to assess how tariff and irradiance assumptions influence the recommendation.

## Key Features

| Feature | Description |
| --- | --- |
| System sizing | Evaluates candidate solar and battery capacity combinations. |
| Scenario comparison | Compares grid-only, solar-only, and solar-plus-battery cases. |
| Battery dispatch | Simulates charge/discharge behavior and state-of-charge limits. |
| Tariff modelling | Supports flat-rate and time-of-use electricity pricing. |
| Sensitivity analysis | Tests recommendation stability under changed tariff and irradiance assumptions. |
| Building presets | Provides representative presets for common building profiles. |
| Interactive visualization | Displays hourly energy flows, KPIs, bill comparison, and recommendation details. |

## Backend Modules

| Module | Purpose |
| --- | --- |
| `backend/app/engine/load.py` | Generates synthetic hourly load profiles from monthly demand. |
| `backend/app/engine/solar.py` | Estimates PV generation from location, available roof area, and system size. |
| `backend/app/engine/battery.py` | Simulates battery charge, discharge, and state of charge. |
| `backend/app/engine/scheduler.py` | Implements rule-based and forecast-assisted dispatch strategies. |
| `backend/app/engine/tariff.py` | Calculates electricity costs under supported tariff structures. |
| `backend/app/engine/finance.py` | Computes capital cost, savings, and payback metrics. |
| `backend/app/engine/scenario.py` | Runs candidate evaluation and scenario ranking. |
| `backend/app/engine/metrics.py` | Calculates technical performance indicators. |

## Technology Stack

| Layer | Tools |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Zustand, Recharts, Lucide React |
| Backend | FastAPI, Pydantic, NumPy, Pandas |
| Deployment | Vercel for the frontend, Render for the backend |
| Testing | Pytest for backend smoke tests, ESLint for frontend checks |

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Service health check. |
| `GET` | `/api/presets` | Returns building presets and default tariff/cost assumptions. |
| `POST` | `/api/analyze` | Runs the full analysis pipeline and returns recommendations, KPIs, hourly time series, scenario comparisons, and sensitivity results. |

## Local Development

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

For local API routing, set:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Deployment Notes

The frontend is configured for Vercel and should use the backend base URL through `NEXT_PUBLIC_API_URL`.

The backend is configured for Render through `render.yaml`. In production, `CORS_ORIGINS` should include the deployed frontend URL:

```text
https://batteryems.vercel.app
```

## Repository Structure

```text
batteryems-ai/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route handlers
│   │   ├── data/         # Presets and generated data artifacts
│   │   ├── engine/       # Simulation and optimization modules
│   │   ├── schemas/      # Pydantic request and response models
│   │   ├── services/     # Analysis orchestration
│   │   └── main.py       # FastAPI application entry point
│   ├── scripts/          # Utility and benchmark scripts
│   └── tests/            # Backend tests
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js app routes and layout
│   │   ├── components/   # Input, chart, and result components
│   │   ├── lib/          # API client and helpers
│   │   ├── store/        # Zustand state store
│   │   └── types/        # TypeScript API types
│   └── package.json
├── docs/                 # Implementation notes and specifications
├── render.yaml           # Render service blueprint
└── README.md
```
