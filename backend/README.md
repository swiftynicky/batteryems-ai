# BatteryEMS Backend

This directory contains the FastAPI backend for BatteryEMS AI.

## Entry Point
- ASGI app: `app.main:app`
- Health check: `GET /health`
- API routes: `POST /api/analyze`, `GET /api/presets`

## Local Development
Run from `backend/`:

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Render Deployment
Render should use the repository root `render.yaml` or the same commands in the Render dashboard.

Build command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

If you prefer the Render dashboard, set:
- Environment: Python
- Root directory: `backend`
- Health check path: `/health`
- Auto-deploy: enabled for the main branch

## Environment Variables
Set these on Render:

- `CORS_ORIGINS`: comma-separated list of allowed frontend origins, such as `http://localhost:3000` and your Vercel URL like `https://your-app.vercel.app`
- `CORS_ORIGIN_REGEX`: optional origin regex for Vercel deployments. Default: `https://.*\.vercel\.app`

Render provides `PORT` automatically. Do not commit secrets or `.env` files.
