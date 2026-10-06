# AURA Data Intelligence — Frontend

> **Multi-Agent Data Cleaning and Visualization Platform**  
> *Final-Year B.Tech AIML Capstone Project*

---

## 🚀 Overview

Real-world datasets suffer from missing values, duplicate records, inconsistent schemas, invalid entries, and extreme statistical outliers. Traditional ETL pipelines apply rigid, monolithic heuristics.

**AURA Data Intelligence** introduces an autonomous **multi-agent data cleaning pipeline** where specialized cooperating agents profile, remediate, validate, and extract intelligence with full explainability:

```text
Raw Dataset
    │
    ▼
[ Orchestrator Agent ] ────────── State Graph & DAG Scheduling
    │
    ▼
[ Profiling Agent ] ───────────── Schema, Quantiles & Entropy
    │
    ▼
[ Missing Value Agent ] ───────── Skewness-Aware Median/Mode Imputation
    │
    ▼
[ Duplicate Detection Agent ] ─── Multi-Key Exact & Levenshtein Matches
    │
    ▼
[ Standardization Agent ] ────── Canonical Casing & ISO-8601 Formatting
    │
    ▼
[ Anomaly Detection Agent ] ──── Isolation Forest & IQR Boundary Scaling
    │
    ▼
[ Validation Agent ] ─────────── Schema Assertions & Domain Bounds
    │
    ▼
[ Quality Score Certified ] ──── Completeness, Consistency, Validity, Uniqueness
    │
    ├──► [ Visualization Agent ] ── Recommends Optimal Bivariate/Distribution Charts
    │
    └──► [ Insight Agent ] ──────── Mines Calibrated Trends & Statistical Signals
           │
           ▼
     [ AURA AI Analyst ] ────────── Natural Language Conversational Q&A
```

---

## 🛠 Technology Stack

- **Framework:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS v4 (Modern, minimal, light SaaS theme)
- **UI Components:** Custom shadcn/ui-inspired accessible components
- **Icons:** Lucide React
- **Routing:** React Router v7
- **Data Visualization:** Recharts
- **Backend Bridge:** Prepared for FastAPI + Python + LangGraph + Gemini (`/api`) with seamless mock fallback.

---

## 🚦 Quick Start

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies (already installed)
npm install

# Launch Vite development server
npm run dev

# Or build for production
npm run build
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🗺 Application Routes

| Route | Page | Purpose |
|---|---|---|
| `/login` | Login | Sign in with credentials & brand tagline |
| `/register` | Sign Up | Register new user account with validation |
| `/dashboard` | Dashboard | KPI cards, 94.2 quality summary, recent datasets |
| `/datasets` | Datasets | Drag-and-drop upload (CSV/XLSX) & dataset inventory |
| `/datasets/:datasetId` | Dataset Details | Metadata breakdown & spreadsheet-style preview |
| `/cleaning/:jobId` | Multi-Agent Cleaning | Interactive DAG, running animations & explainability |
| `/agents` | Agent Performance | Latency profiling chart & telemetry monitoring table |
| `/analytics/:datasetId` | Analytics | Descriptive stats, histograms, Pearson heatmap |
| `/visualizations/:datasetId` | Visualizations | Scatter, bar, line, and box charts with AI rationale |
| `/insights/:datasetId` | AI Insights | High-confidence findings & recommendations |
| `/ai-analyst` | AURA AI Analyst | ChatGPT-style dataset interrogation interface |
| `/settings` | Settings | Backend endpoint configuration & project specs |

---

## 🔌 FastAPI Backend Contract

The frontend is wired to connect to:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
GET  /api/datasets
POST /api/datasets/upload
GET  /api/datasets/{id}
GET  /api/datasets/{id}/preview
DELETE /api/datasets/{id}
POST /api/datasets/{id}/clean
GET  /api/cleaning/{jobId}
GET  /api/cleaning/{jobId}/agents
GET  /api/agents/performance
GET  /api/analytics/{datasetId}
GET  /api/visualizations/{datasetId}
GET  /api/insights/{datasetId}
POST /api/chat
```

When the FastAPI server is not yet running, AURA seamlessly uses rich, realistic mock telemetry (`workforce_data.csv`, 10,000 rows, 18 features, 94.2% quality) to guarantee a flawless live demonstration for faculty evaluations and technical interviews.
