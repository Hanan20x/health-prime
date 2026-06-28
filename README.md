# HealthPrime: A Web-Based Multi-Agent Health Information System

> **Final Year Project (FYP2) — Bachelor of Computer Science (Software Engineering)**
> Faculty of Computing, Universiti Teknologi Malaysia (UTM)
> **Author:** Hanan Osama Hussein Salah | **Supervisor:** Dr. Shahliza Bt. Abd. Halim | **July 2026**

---

## Overview

**HealthPrime** is a web-based, multi-agent Health Information System designed for **Alraith Primary Healthcare Centre (PHC)**, Jazan Region, Kingdom of Saudi Arabia — a government facility providing maternal and child care, immunisation, chronic disease management, and health education to rural communities.

The existing Raqeem HIS used at Alraith PHC lacks intelligent automation, forcing staff to manually manage high-stress scheduling and symptom analysis. This creates clinical time poverty, long waiting times, and increased risk of human error. HealthPrime addresses these bottlenecks by integrating two specialised AI agents into a secure, bilingual, role-based platform, directly supporting **Saudi Arabia's Vision 2030** healthcare transformation goals.

---

## Key Features

### AI Agents
- **AI Appointment Scheduling Agent** — LangGraph workflow that analyses clinic load, doctor availability, and patient priority to optimise slot allocation and minimise waiting times. Returns structured per-field diffs (Priority, Doctor, Date, Time) with nurse-readable explanations. The human always makes the final decision.
- **AI Diagnostic Assistance Agent** — Analyses patient symptoms, vitals, EMR history, allergies, and chronic conditions to suggest ranked ICD-10-CM codes with composite confidence scores and clinical rationale. Falls back to a deterministic keyword-matching engine if the LLM is unavailable.

### Core Clinical & Administrative Features
- **Role-Based Access Control (RBAC)** — Three roles: E-Health Admin (full access), Nurse (patient registration, vitals, appointments), Doctor (EMR view, AI diagnosis — read-only on patient data)
- **Patient Management** — Registration, search, and full Electronic Medical Record (EMR) with section history audit trail
- **Appointment Scheduling** — Calendar-based booking (day/week/month) with conflict detection and AI optimisation review
- **Vital Signs Recording** — Nurses record heart rate, blood pressure, SpO2, temperature, BMI, and BSA over time with chart visualisation (Recharts)
- **ICD-10 Search** — Real-time NLM Clinical Table Search Service + Gemini 2.5 Flash AI-assisted code descriptions
- **Bilingual UI** — Full Arabic / English toggle with right-to-left layout support
- **Multi-Tab Support** — `sessionStorage`-based auth allows different roles to be open simultaneously
- **OTP Authentication** — Two-factor login (password + one-time password via email) with JWT session tokens (24-hour expiry)
- **Immutable EMR Audit Log** — Every edit to a clinical section is recorded with previous content, editor, and timestamp

---

## System Architecture

HealthPrime follows a layered, **MVC-inspired architecture**:

```
┌─────────────────────────────────────────────────────┐
│  VIEW LAYER — React.js SPA (Vite + TypeScript)      │
│  shadcn/ui · Tailwind CSS · TanStack Query v5        │
│  Pages: Dashboard · Patients · Appointments ·        │
│         AI Diagnosis · EMR · Vitals · Profile        │
├─────────────────────────────────────────────────────┤
│  CONTROLLER LAYER — FastAPI (Python)                 │
│  Routers: auth · patients · providers · dashboard ·  │
│           appointments · vitals · EMR ·              │
│           AI Scheduling Agent · AI Diagnostic Agent  │
│  JWT auth · Pydantic v2 validation · CORS            │
├─────────────────────────────────────────────────────┤
│  MODEL LAYER — SQLAlchemy 2.0 + PostgreSQL           │
│  Entities: Provider · Patient · Appointment ·        │
│            VitalSign · EmrSection · PatientDiagnosis │
│            ClinicalOrder · ActivityLog               │
└─────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix UI), TanStack Query v5, react-big-calendar, Recharts, react-hook-form + Zod, react-router-dom v6 |
| Backend | FastAPI, SQLAlchemy 2.0, PostgreSQL (psycopg3) |
| AI — Diagnostic Agent | Gemini 2.5 Flash (direct REST, `thinkingBudget=8192`) + Groq (LangChain) |
| AI — Scheduling Agent | LangGraph + Gemini 2.5 Flash (direct REST) |
| RAG | Local BM25 keyword engine (`data/bm25_docs.pkl`) + NLM ICD-10-CM API |
| Auth | JWT (24h expiry) + bcrypt password hashing + in-memory OTP (email via SMTP, 5-min TTL) |
| Testing | Playwright (E2E), Vitest + Testing Library (unit), Postman (API) |
| Dev Tools | VS Code, Git, Docker (PostgreSQL) |

---

## Project Structure

```
health-prime-2/
├── src/                         # React frontend
│   ├── pages/                   # Route pages (Dashboard, Patients, Appointments, AI Diagnosis, EMR, Vitals …)
│   ├── components/layout/       # Sidebar, Header, DashboardLayout
│   ├── api/client.ts            # Typed fetch client (reads VITE_API_URL, attaches JWT)
│   ├── api/types.ts             # TypeScript API types
│   ├── hooks/useAuth.ts         # Auth state hook (sessionStorage)
│   └── lib/i18n.ts              # Bilingual translation dictionary (EN/AR)
├── backend/
│   ├── app/
│   │   ├── routers/             # FastAPI route handlers (auth, patients, appointments, diagnosis, emr, vitals, providers, dashboard)
│   │   ├── models.py            # SQLAlchemy ORM models
│   │   ├── schemas.py           # Pydantic v2 request/response schemas (camelCase aliases)
│   │   ├── config.py            # Pydantic-settings config (.env, SMTP, CORS)
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   ├── deps.py              # JWT auth dependency (CurrentUser)
│   │   ├── otp.py               # In-memory OTP store + SMTP email sender
│   │   ├── seed.py              # Database seeder (providers + patients)
│   │   └── services/            # WHO ICD service
│   ├── data/
│   │   └── bm25_docs.pkl        # Pre-built BM25 index for ICD-10 keyword search
│   └── requirements.txt
└── run_backend.py               # Uvicorn entry point (port 8000, reload)
```

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 16 (or Docker)
- Gemini API key

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
GROQ_API_KEY=your_groq_api_key_here

SECRET_KEY=your_jwt_secret_key

DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/healthprime

# Optional — OTP emails (if unset, OTP codes are printed to the console)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

Start PostgreSQL (via Docker):

```bash
docker compose up -d
```

Start the backend (auto-creates tables and seeds on first run):

```bash
# From the project root
python run_backend.py
```

Backend runs at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

### 2 — Frontend

```bash
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

> **OTP in development:** If `SMTP_USER` / `SMTP_PASSWORD` are not set in `.env`, the OTP code is printed directly to the backend console instead of being emailed.

---

## AI Agents — Technical Detail

### Diagnostic Assistance Agent (`POST /patients/{id}/ai-diagnosis`)

- **Primary LLM:** Gemini 2.5 Flash via direct REST (`thinkingBudget=8192`)
- **Secondary LLM:** Groq (via LangChain `ChatGroq`) for keyword description enrichment
- **RAG:** Local BM25 index (`data/bm25_docs.pkl`) + NLM ICD-10-CM API (async, cached)
- **Reasoning pipeline:** Symptom clustering → differential generation → ICD-10-CM mapping → evidence scoring → source verification
- **Confidence scoring (5-factor weighted):**

  | Factor | Weight |
  |--------|--------|
  | Symptom-criteria match | 30% |
  | Lab / vital alignment | 25% |
  | Retrieval (RAG) similarity | 20% |
  | Self-consistency | 15% |
  | Comorbidity prior | 10% |

- **Fallback:** Deterministic keyword-matching engine (built-in dictionary of common ICD-10 codes) when Gemini is unavailable
- **Safety:** Explicitly instructed never to fabricate clinical citations; low-confidence results are flagged to the doctor

### Appointment Scheduling AI Agent (`POST /appointments/optimize`)

- **Architecture:** LangGraph stateful workflow — two sequential nodes:
  1. `gather_data` — retrieves patient EMR, recent vitals, and active clinical orders from DB
  2. `suggest_slot` — passes context + staff entry to Gemini 2.5 Flash; returns structured JSON review
- **Output per field (Priority, Doctor, Date, Time):** original value · suggested value (or `KEEP`) · discrepancy flag · nurse-readable explanation
- **Conflict resolution:** 30-minute slot shifts, up to 20 attempts; surfaces conflicting patient name + time in UI
- **Optimisation dimensions:** Priority SLA · Doctor Appropriateness · Slot Efficiency/Timing · Load Balancing
- **Principle:** AI recommends; the Nurse or Admin always confirms the final booking

---

## Deployment

### Frontend — Vercel (recommended)

```bash
npm run build    # outputs to dist/
```

1. Push this repo to GitHub.
2. Import on [vercel.com](https://vercel.com) → **New Project**.
3. **Framework:** Vite · **Build Command:** `npm run build` · **Output Directory:** `dist`.
4. Add environment variable: `VITE_API_URL=https://your-backend-url`.
5. Deploy.

### Backend — Render (recommended)

1. New **Web Service** on [render.com](https://render.com), connect your GitHub repo.
2. **Root Directory:** `backend` · **Build Command:** `pip install -r requirements.txt` · **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
3. Add a **PostgreSQL** database instance (free tier available) and copy the connection string.
4. Add environment variables: `GEMINI_API_KEY`, `GROQ_API_KEY`, `SECRET_KEY`, `DATABASE_URL` (from step 3), and optionally SMTP settings.
5. Deploy.

---

## Testing

| Type | Tool | Coverage |
|------|------|----------|
| Unit | Vitest + Testing Library | Frontend components and utility functions |
| Integration | Postman / FastAPI TestClient | API endpoints including AI agent routes |
| End-to-End | Playwright | Full browser flows for all use cases |
| Black-Box | Manual | All use cases including AI conflict-detection and fallback behaviour |

---

## Methodology

Development followed **Agile Scrum** with iterative sprints and continuous stakeholder feedback from a General Practitioner (Dr. Marwa Alamin) and a Public Health Registrar (Dr. Osama Hussein), both with 13+ years of experience at Alraith PHC.

---

## License

This project was developed for academic purposes (FYP2 — UTM, July 2026). All rights reserved.
