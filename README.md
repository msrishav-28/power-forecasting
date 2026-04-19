# POWERGRID ER-I Intelligence Dashboard

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)

Full-stack internship project workspace for a zero-cost deployment target:

- `frontend/`: React + Vite + Tailwind dashboard for Vercel
- `backend/`: FastAPI inference and AI service for Render
- `data/`: raw, processed, synthetic, and ingestion-ready assets
- `models/`: trained local artifacts reused by the backend

This repo no longer preserves any Streamlit app path. The deployed system is a clean monorepo with a static-first dashboard boot flow and an API layer for live predictions, Gemini insights, and optional Qdrant-backed RAG.

## Stack

- Frontend: React 18, Vite, Tailwind CSS, Tremor, Recharts, React-Leaflet
- Backend: FastAPI, SQLAlchemy, Render Postgres, Gemini, Qdrant
- ML/runtime: scikit-learn, XGBoost, Prophet, LightGBM, PyTorch
- Hosting: Vercel free tier + Render free web service + Render Postgres free

## Repo layout

```text
power/
├── frontend/                  # Vite dashboard deployed on Vercel
│   ├── public/snapshots/      # Split JSON contracts consumed on boot
│   └── src/
├── backend/                   # FastAPI service deployed on Render
│   ├── app/
│   ├── ingestion/
│   └── requirements.txt
├── data/
│   ├── raw/
│   ├── processed/
│   │   └── snapshots/
│   ├── synthetic/
│   └── ingestion/
├── docs/
├── models/                    # Existing trained artifacts reused in dev
├── render.yaml                # Render blueprint for the API service
└── utils/
    ├── export_dashboard_snapshot.py
    └── synthetic_generator.py
```

## How it works

### 1. Static snapshot boot

The dashboard always starts from split snapshot files:

- `frontend/public/snapshots/meta.json`
- `frontend/public/snapshots/assets.json`
- `frontend/public/snapshots/grid.json`
- `frontend/public/snapshots/corridors.json`

These are generated from the Python data workspace and also copied to:

- `data/processed/snapshots/`

That means the UI still loads even if the Render backend is cold-starting.

### 2. Live API layer

The FastAPI service adds on-demand endpoints for:

- RUL prediction
- anomaly scoring
- load forecasting
- outage cause prediction
- NDVI risk prediction
- Gemini insight generation
- Qdrant-backed RAG chat

### 3. Database and cache

Render Postgres stores:

- `assets`
- `predictions`
- `llm_insights`
- `corridor_risks`
- `documents`

LLM responses are cached with TTL. Gemini is never called on dashboard page load.

## Local development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Refresh snapshots

From the repo root:

```bash
py utils/export_dashboard_snapshot.py
```

Or from `frontend/`:

```bash
npm run sync:data
```

## Environment variables

### Frontend

- `VITE_API_BASE_URL=http://localhost:8000`

### Backend

Use `backend/.env.example` as the template.

Key variables:

- `DATABASE_URL`
- `FRONTEND_ORIGINS`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_EMBEDDING_MODEL`
- `QDRANT_URL`
- `QDRANT_API_KEY`
- `QDRANT_COLLECTION`
- `HUGGINGFACE_MODEL_REPO`

## Deployment

### Vercel

1. Import the repo
2. Set Root Directory to `frontend`
3. Add `VITE_API_BASE_URL` pointing to the Render backend
4. Deploy

### Render

This repo includes a root `render.yaml` blueprint for the FastAPI service.

If you configure it manually:

1. Create a new Web Service
2. Set Root Directory to `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Attach a free Render Postgres database and set `DATABASE_URL`

## Public API

- `GET /health`
- `POST /api/predict/rul`
- `POST /api/predict/anomaly`
- `GET /api/forecast/load`
- `POST /api/predict/outage-cause`
- `POST /api/predict/ndvi-risk`
- `POST /api/llm/insight`
- `POST /api/chat/rag`

## Ingestion

Drop public PDFs into `data/ingestion/`, then run:

```bash
py backend/ingestion/ingest_documents.py
```

That script chunks the documents, embeds them with Gemini, writes vectors to Qdrant, and mirrors metadata into Postgres.

## Verification

The current repo has been verified with:

```bash
py utils/export_dashboard_snapshot.py
cd frontend
npm run lint
npm run build
py -m compileall backend
```

The backend endpoints were also exercised locally through FastAPI `TestClient`, including the fallback no-key paths for `/api/llm/insight` and `/api/chat/rag`.
