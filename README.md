# BatteryEMS AI

**Intelligent Solar + Battery Planning Advisor for Buildings**

BatteryEMS AI is a decision-support system that helps building operators evaluate optimal solar PV and battery energy storage system (BESS) configurations. Given a building's load profile, location, tariff structure, and system constraints, it runs a multi-scenario optimization to recommend the best system sizing — balancing annual savings, payback period, and grid independence.

> Built as a B.Tech Minor Project (EE3094E) at NIT Calicut.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **AI-Powered Sizing** | Evaluates all candidate solar × battery combinations and scores them on a composite objective (savings, payback, peak reduction) |
| **Scenario Comparison** | Side-by-side annual bill comparison: Grid-Only vs Solar-Only vs Solar + Battery |
| **24-Hour Energy Simulation** | Hourly dispatch simulation showing load, solar generation, battery charge/discharge, and grid import |
| **Battery SOC Tracking** | Visualizes state-of-charge within the 10–90% operating window |
| **Sensitivity Analysis** | Tests the recommendation against varying irradiance and tariff scenarios |
| **Building Presets** | Pre-configured profiles for apartments, offices, hospitals, and campuses |

---

## Architecture

```
┌─────────────────────┐       ┌─────────────────────────┐
│   Next.js Frontend  │──────▶│   FastAPI Backend        │
│   (Vercel)          │  API  │   (Render)               │
│                     │       │                          │
│  • Dashboard UI     │       │  • Load profile engine   │
│  • Recharts viz     │       │  • Solar generation model│
│  • Zustand state    │       │  • Battery scheduler     │
│  • Dynamic imports  │       │  • Financial calculator  │
└─────────────────────┘       │  • Scenario optimizer    │
                              └─────────────────────────┘
```

### Backend Modules (`backend/app/engine/`)

| Module | Purpose |
|--------|---------|
| `load.py` | Synthetic hourly load profile generation from monthly kWh |
| `solar.py` | Solar PV generation model based on location and roof area |
| `battery.py` | Battery charge/discharge simulation with SOC constraints |
| `scheduler.py` | Rule-based and forecast-assisted dispatch scheduling |
| `tariff.py` | Electricity tariff calculation (flat rate and time-of-use) |
| `finance.py` | CapEx, annual savings, and simple payback computation |
| `scenario.py` | Multi-scenario comparison and candidate ranking |
| `metrics.py` | KPI calculation (peak reduction, self-consumption, etc.) |
| `annualize.py` | Weighted annualization from representative days |

### Frontend Stack

- **Framework:** Next.js 16 (App Router)
- **State:** Zustand
- **Charts:** Recharts (lazy-loaded)
- **Icons:** Lucide React
- **Animation:** Framer Motion
- **Design:** Custom CSS design system — Space Grotesk + Inter typography, amber/teal accent palette

---

## Live Demo

| Service | URL |
|---------|-----|
| Frontend | *Deployed on Vercel — see below* |
| Backend | *Deployed on Render — see below* |

---

## Local Development

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Test with:
```bash
curl http://localhost:8000/health
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

> The frontend proxies `/api/*` requests to the backend via Next.js rewrites.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/presets` | Returns building presets and default tariff/cost parameters |
| `POST` | `/api/analyze` | Runs the full analysis pipeline and returns recommendation, KPIs, hourly series, scenario comparison, sensitivity, and explanations |

---

## Deployment

### Frontend → Vercel

1. Import the repository on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Set environment variable: `NEXT_PUBLIC_API_URL` = your Render backend URL
4. Deploy

### Backend → Render

1. Connect the repository on [render.com](https://render.com)
2. The `render.yaml` blueprint will auto-configure the service
3. Set environment variable: `CORS_ORIGINS` = your Vercel frontend URL
4. Deploy

---

## Project Structure

```
batteryems-ai/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route handlers
│   │   ├── engine/       # Core simulation modules
│   │   ├── schemas/      # Pydantic request/response models
│   │   ├── services/     # Orchestration layer
│   │   └── main.py       # App entry point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js pages and layout
│   │   ├── components/   # UI components (charts, inputs, results)
│   │   ├── lib/          # API client and formatters
│   │   ├── store/        # Zustand state management
│   │   └── types/        # TypeScript type definitions
│   └── package.json
├── docs/                 # Implementation specification
├── render.yaml           # Render deployment blueprint
└── README.md
```

---

## License

This project is part of an academic course submission and is not licensed for commercial use.
