# BatteryEMS AI

BatteryEMS AI is an academic decision-support project for planning solar PV and battery storage systems for buildings. It combines a FastAPI backend with a Next.js frontend to estimate system sizing, savings, payback, and operating behavior.

## Project Layout
- `backend/`: analysis API and optimization logic
- `frontend/`: dashboard and deployment target
- `data/`: sample outputs used for reference
- `docs/`: project notes and implementation specification

## Local Run
1. Start the backend from `backend/` with `pip install -r requirements.txt` and `python -m uvicorn app.main:app --reload --port 8000`.
2. Start the frontend from `frontend/` with `npm install` and `npm run dev`.
3. See `frontend/README.md` for the frontend environment variables and Vercel deployment flow.

## Notes
- Keep secrets out of the repository.
- Keep generated build outputs and local install folders untracked.
- This repo is intended for presentation and academic demonstration.
