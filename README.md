# HealthPrime

A full-stack Health Information System for **Alraith Primary Healthcare Center, Ministry of Health — Kingdom of Saudi Arabia**, built as a Final Year Project (FYP2).

---

## Features

- **Role-based access control** — E-Health Admin, Nurse, and Doctor roles with distinct permissions enforced on both frontend and backend
- **Patient Management** — register, search, and maintain patient records with full EMR view
- **Appointments** — calendar-based scheduling with conflict detection and slot management
- **Vitals Recording** — nurses record and track patient vitals over time
- **AI Diagnostic Agent** — Gemini 2.5 Flash with RAG (NLM ICD-10-CM + BM25) and 5-metric confidence scoring
- **AI Scheduling Optimizer** — LangGraph agent that optimizes appointments across 4 dimensions: priority SLA, doctor appropriateness, slot efficiency, and load balancing
- **ICD-10 Search** — real-time NLM API + AI-assisted code descriptions
- **Bilingual UI** — Arabic / English toggle
- **Multi-tab support** — `sessionStorage`-based auth allows different roles open simultaneously

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query |
| Backend | FastAPI, SQLAlchemy, SQLite |
| AI | LangGraph, Gemini 2.5 Flash, Groq |
| Auth | JWT (role-scoped), sessionStorage |

---

## Project Structure

```
health-prime-2/
├── src/                    # React frontend
│   ├── pages/              # Route pages (Dashboard, Patients, Appointments, AI Diagnosis …)
│   ├── components/         # Shared UI components (layout, sidebar, header)
│   ├── api/                # Axios client + TypeScript types
│   ├── hooks/              # useAuth and other custom hooks
│   └── lib/                # i18n and utilities
├── backend/
│   ├── app/
│   │   ├── routers/        # FastAPI route handlers
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── config.py       # Environment config
│   │   ├── seed.py         # Database seeder
│   │   └── services/       # WHO ICD service and AI agents
│   ├── requirements.txt
│   └── healthprime.db      # SQLite database (auto-created)
└── run_backend.py          # Backend entry point
```

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- Python 3.10+
- A Gemini API key (for AI features)

### 1 — Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here      # optional, for Groq LLM fallback
SECRET_KEY=your_jwt_secret_key
```

Seed the database and start the server:

```bash
# From the project root
python run_backend.py
```

Backend runs at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

### 2 — Frontend

```bash
# From the project root
npm install
npm run dev
```

Frontend runs at `http://localhost:8080`.

### Default Credentials (seeded)

| Role | Email | Password |
|------|-------|----------|
| E-Health Admin | admin@healthprime.sa | admin123 |
| Nurse | nurse@healthprime.sa | nurse123 |
| Doctor | doctor@healthprime.sa | doctor123 |

---

## Deployment

### Frontend — Vercel (recommended)

```bash
npm run build          # outputs to dist/
```

1. Push this repo to GitHub.
2. Import the repo on [vercel.com](https://vercel.com).
3. Set **Build Command** → `npm run build`, **Output Directory** → `dist`.
4. Add environment variable `VITE_API_URL=https://your-backend-url`.
5. Deploy.

### Backend — Render (recommended for free tier)

1. Create a new **Web Service** on [render.com](https://render.com).
2. Connect your GitHub repo.
3. Set **Root Directory** → `backend`, **Build Command** → `pip install -r requirements.txt`, **Start Command** → `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. Add environment variables: `GEMINI_API_KEY`, `GROQ_API_KEY`, `SECRET_KEY`.
5. Deploy.

> **Note:** Switch the database from SQLite to PostgreSQL for production. Render provides a free managed PostgreSQL instance.

### Alternative — Docker

```bash
# Build and run locally
docker compose up --build
```

*(Docker Compose file not yet included — add `docker-compose.yml` when containerising.)*

---

## AI Agents

### Diagnostic Agent (`POST /patients/{id}/ai-diagnosis`)

- Gemini 2.5 Flash with `thinkingBudget=8192`
- RAG pipeline: NLM ICD-10-CM API → local BM25 keyword engine (`data/bm25_docs.pkl`)
- Confidence scoring: Symptom 30% · Lab/Vital 25% · RAG 20% · Self-consistency 15% · Comorbidity 10%
- Falls back to local keyword-matching engine when Gemini is unavailable

### Scheduling Optimizer (`POST /appointments/optimize`)

- LangGraph pipeline: `gather_data` → `suggest`
- Optimizes across: Priority SLA · Doctor Appropriateness · Slot Efficiency / Timing · Load Balancing
- Conflict resolution: 30-minute slot shifts, up to 20 attempts; surfaces conflicting patient name + time in UI

---

## License

This project was developed for academic purposes (FYP2). All rights reserved.
