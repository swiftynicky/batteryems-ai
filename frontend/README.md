# BatteryEMS Frontend

This is the Next.js frontend for BatteryEMS AI. It provides the building analysis form, charts, and recommendation views.

## Local Development
Run the app from the `frontend/` directory:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` after the dev server starts.

## Environment Variables
Set these values for local development and for Vercel deployments:

- `NEXT_PUBLIC_API_URL`: base URL of the BatteryEMS backend API. Use `http://localhost:8000` for local development or the deployed backend URL in production.
- `NEXT_PUBLIC_WS_URL`: websocket endpoint for the deployed backend, if your deployment uses one.

Production backend:

- `https://batteryems-backend.onrender.com`

If `NEXT_PUBLIC_API_URL` is not set, the frontend falls back to same-origin `/api` requests for local use only.

## Vercel Deployment
Deploy from the `frontend/` directory so Vercel treats this app as the project root.

```bash
cd frontend
vercel link
vercel --prod
```

Before the production deploy, make sure the Vercel project has the environment variables above configured for the correct backend and websocket endpoints.

## Notes
- The frontend is designed to work with a separately deployed backend.
- Do not commit local environment files or build outputs.
