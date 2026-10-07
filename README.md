# AURA Data Intelligence

Multi-agent data cleaning and visualization platform. Upload a CSV or Excel
file and a LangGraph pipeline of agents profiles it, fills missing values,
removes duplicates, standardizes categories, flags anomalies, validates the
result and generates charts plus Gemini-powered insights.

- `backend/` – FastAPI + LangGraph + MongoDB
- `frontend/` – React + TypeScript + Vite

## Pipeline

1. **Profiling** – column types, missing values, duplicates, statistics
2. **Missing values** – median for numbers, mode for text (fully empty columns are left as is)
3. **Duplicates** – exact duplicate rows removed
4. **Standardization** – merges values that differ only by case/spacing (`it`, ` IT ` → `IT`)
5. **Anomaly detection** – business-rule violations (e.g. age > 120), negative values, infinite values, IQR outliers
6. **Validation** – final checks and quality score
7. **Visualization** – histograms, bar charts, trends
8. **Insights** – Gemini summary, findings and recommendations

## Backend setup

Requires Python 3.11+ and a MongoDB database (e.g. MongoDB Atlas).

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows  (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
cp .env.example .env            # then fill in MONGODB_URL, JWT_SECRET, GEMINI_API_KEY
uvicorn main:app --reload
```

The API runs on http://localhost:8000 (interactive docs at `/docs`).
`GEMINI_API_KEY` is optional: without it, cleaning works but insights and the
AI Analyst chat report that AI is unavailable.

### Tests

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

Tests use an in-memory MongoDB and never call Gemini.

## Frontend setup

Requires Node.js 20+.

```bash
cd frontend
npm install
cp .env.example .env            # VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

Open http://localhost:5173, register an account and upload a dataset.

## API overview

All endpoints except `/`, `/health`, `/auth/register` and `/auth/login`
require `Authorization: Bearer <token>`. Datasets are private to their owner.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/register`, `/auth/login` | Create account / log in → `{user, token}` |
| GET | `/auth/me` | Current user |
| GET | `/datasets` | List your datasets |
| POST | `/datasets/upload` | Upload CSV/XLSX/XLS (multipart `file`) |
| GET, DELETE | `/datasets/{id}` | Dataset metadata / delete |
| GET | `/datasets/{id}/profile` | Profile of the original upload |
| GET | `/datasets/{id}/preview?limit=100` | First rows (cleaned if processed) |
| POST | `/datasets/{id}/process` | Run the full agent pipeline |
| GET | `/datasets/{id}/result` | Stored processing result |
| GET | `/datasets/{id}/download` | Cleaned CSV |
| GET | `/analytics/{id}` | Descriptive statistics, distributions, correlations |
| GET | `/visualizations/{id}` | Generated charts |
| GET | `/insights/{id}` | AI insights |
| GET | `/agents/performance` | Per-agent timings across your datasets |
| POST | `/chat` | Ask the AI Analyst about a dataset |
