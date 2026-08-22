# 🛡️ NivaranAI — Hyperlocal Multi-Hazard Early-Warning Platform

> AI-assisted, ward-level disaster risk fusion and citizen-government coordination platform for urban India.

**Team:** ReGenX · **Event:** Smart India Hackathon 2026
**Problem Statement ID:** SOAIDEATHON-S32
**Problem Statement Title:** Hyperlocal Multi-Hazard Early-Warning Fusion with Uncertainty-Aware Action Guidance
**Theme:** Disaster Management · **PS Category:** Software



[![SIH 2026](https://img.shields.io/badge/SIH-2026-orange)](https://sih.gov.in)
[![Python](https://img.shields.io/badge/Python-3.11%2B-blue)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.x-black)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF)](https://vitejs.dev/)
[![Appwrite](https://img.shields.io/badge/Appwrite-BaaS-F02E65)](https://appwrite.io/)
[![Gemini API](https://img.shields.io/badge/Gemini-Explanations-4285F4)](https://ai.google.dev/)

---

## 1. Executive Summary

Indian cities currently track weather, flood, and civic hazard data in silos — IMD weather feeds, CWC flood bulletins, and citizen reports never get combined into a single actionable score. The result: alerts are broad, regional, and carry no indication of how *certain* the warning actually is, so citizens learn to ignore repeated notifications.

**NivaranAI fuses multiple live hazard signals into one ward-level, confidence-scored risk rating**, updated automatically every 20 minutes, and routes role-specific guidance to citizens, government officials, and system administrators through a single command platform.

The system is piloted for **Bhubaneswar Municipal Corporation (BMC)**, covering all **67 official wards**, and is designed to be extended to additional cities and hazard types without re-architecting the core engine.

### Core Value Proposition
- **Fusion, not silos:** combines Open-Meteo weather data, Tomorrow.io lightning/rainfall cross-checks, and verified citizen reports into one score per hazard per ward.
- **Uncertainty-aware:** every risk score ships with a numeric **confidence value**, computed from cross-source agreement and citizen corroboration — not just a raw severity label.
- **Role-specific action, not just alerts:** citizens get proximity-based push/SMS warnings and safe-place routing; officials get full telemetry, verification tools, and camp management; admins get audit-logged platform oversight.
- **Human-readable explanations:** Gemini API converts the underlying rule-based score into a plain-language alert explanation — the AI layer explains the result, it does not compute it (rule-based scoring remains fully deterministic and auditable).

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (ReGenX)                          │
│         React 19 + TypeScript + Vite + Tailwind + Leaflet       │
│   Citizen · Government · Admin dashboards · Firebase Push (FCM) │
└───────────────────────────────┬─────────────────────────────────┘
                                 │ REST (fetch) — Bearer session token
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND API (Flask · api.py)                │
│   auth_service · crowd_updates · emergency_locations · news     │
│   notification_service · sms_service · map_zones                │
└───────────────┬───────────────────────────────┬─────────────────┘
                │                                │
                ▼                                ▼
┌────────────────────────────┐   ┌────────────────────────────────┐
│   RISK ENGINE (risk_engine.py) │  SCHEDULED RUNNER (scheduled_runner.py) │
│  Open-Meteo + Tomorrow.io      │  Runs score_all_wards() every 20 min    │
│  + citizen corroboration       │  Diffs state → writes only on change    │
│  → severity (LOW→EMERGENCY)    │  → notification_service dispatch        │
│  → confidence (0–100)          │                                        │
└───────────────┬────────────────┘   └───────────────┬────────────────────┘
                │                                     │
                ▼                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Appwrite (BaaS / TablesDB)                 │
│   Users · Sessions · Crowd Reports · Risk Zones · Camps · Audit │
└─────────────────────────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
   Firebase Cloud            Twilio SMS            Gemini API
   Messaging (Push)        (rate-limited)      (alert explanations)
```

---

## 2. Key Features & Innovation (USP)

Derived directly from the codebase (`risk_engine.py`, `api.py`, `auth_service.py`, `docs/PRD.md`):

| Feature | Implementation Evidence |
|---|---|
| **Multi-source hazard fusion** | `risk_engine.py` pulls Open-Meteo (primary weather) and Tomorrow.io (lightning + secondary rainfall) per ward, batched via `fetch_open_meteo_batch` (concurrent, up to 10 workers). |
| **5 hazard types, 67 wards** | `HAZARDS = ["heavy_rainfall", "flood", "waterlogging", "lightning", "cyclone"]` scored individually for every BMC ward in `WARD_DATA`. |
| **Transparent, auditable severity bands** | Fixed 0–100 scale mapped to `LOW (0–30) → MODERATE (31–55) → HIGH (56–80) → EMERGENCY (81–100)` — not a black-box model. |
| **Real confidence scoring (not just a claim)** | `compute_confidence()` starts at a 90 baseline, penalizes disagreement between Open-Meteo and Tomorrow.io rainfall readings (−10 to −20), and adds +8 when 3+ citizen reports corroborate the hazard in that ward. |
| **Citizen reports that nudge, never override** | `apply_citizen_corroboration()` — explicitly documented to adjust severity/confidence only when reports agree with weather-driven signals, preventing spam/false-report manipulation of the core score. |
| **Deterministic, non-AI notification templates** | `notification_service.py` explicitly enforces "Fixed Deterministic Templates (strictly NO AI / Gemini generation)" for push/SMS — Gemini is reserved for explanatory text, not for the safety-critical dispatch path. |
| **Government mitigation as a separate layer** | Official field updates (`CONFIRMED`, `FULLY_MITIGATED`, etc.) never overwrite the analytical risk score — stored as an independent layer per `auth_service.py` architectural constraints. |
| **Role-based access control** | Three enforced roles — `CITIZEN`, `GOVERNMENT_OFFICIAL`, `SYSTEM_ADMIN` — with server-side verification; frontend role claims are never trusted (`auth_service.py`). |
| **Automated 20-minute risk cycle** | `scheduled_runner.py` re-runs `score_all_wards()` every 20 minutes, diffs against prior state to avoid redundant writes, and includes concurrency-lock protection against overlapping runs. |
| **Immutable security audit logging** | `_AUDIT_LOGS` in `auth_service.py` records `actor_user_id`, `action`, `result`, sanitized `metadata`, and `timestamp` for every privileged action. |
| **SMS safety controls** | `sms_service.py` enforces daily send limits, per-recipient cooldowns, and opt-out — preventing alert-fatigue spam even under repeated hazard triggers. |

### Differentiators vs. Existing Systems
- IMD/CWC/seismic feeds are consumed **as inputs**, not replaced — NivaranAI is a fusion and action layer, not a competing authority.
- Alerts are **ward-level**, not district/regional-level.
- Every alert is **shipped with a numeric confidence score**, directly addressing the "people ignore repeated warnings" failure mode named in the PS.

---

## 3. Tech Stack & Architecture

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS 4, Leaflet (maps), Lucide React (icons) |
| **Backend** | Python 3, Flask 3, Flask-CORS, Gunicorn (production WSGI) |
| **Database / BaaS** | Appwrite (Users, Auth, Crowd Reports, Risk Zones, Camps, TablesDB) |
| **AI / Explanation Layer** | Google Generative AI (`google-generativeai`) — Gemini API for plain-language alert text only |
| **Push Notifications** | Firebase Admin SDK + Firebase Cloud Messaging (`firebase-messaging-sw.js`) |
| **SMS** | Twilio (rate-limited, opt-out aware) |
| **External Data APIs** | Open-Meteo (weather), Tomorrow.io (lightning/rainfall cross-check), a configurable Map API, a configurable News API |
| **Auth** | Custom session-token auth (SHA-256 + salt) + Google OAuth2 (citizens only) |
| **Scheduling** | Appwrite Scheduled Functions / cron-compatible runner (`*/20 * * * *`) |
| **Deployment** | Render (`render.yaml`, Gunicorn), Procfile-compatible (Heroku-style), Vercel-hosted frontend (`nivaran-ai-delta.vercel.app`) |
| **Linting** | oxlint (frontend) |

---

## 4. Repository Structure

```
NivaranAI-main/
├── api.py                      # Flask app entry point — all REST routes
├── auth_service.py             # Session auth, RBAC, audit logging, in-memory session store
├── risk_engine.py              # Core hazard scoring engine (THE analytical heart — never modified per team convention)
├── scheduled_runner.py         # 20-min automated risk cycle orchestrator
├── crowd_updates.py            # Citizen-submitted ground report model & storage
├── emergency_locations.py      # Safe places / relief camp logic
├── map_zones.py                # Ward/risk-zone query layer (Appwrite-backed)
├── news_service.py             # Localized disaster news integration
├── notification_service.py     # Deterministic push/SMS dispatch + geofencing + cooldown
├── notification_provider.py    # Provider abstraction (FCM, SMS providers)
├── sms_service.py               # Twilio-backed SMS channel with safety limits
├── requirements.txt            # Python dependencies
├── render.yaml                 # Render.com deployment config
├── Procfile                    # Gunicorn start command (Heroku-style)
├── .env.example                # All required environment variables (see §6)
│
├── docs/                       # Team-authored design & requirements documentation
│   ├── PRD.md                  # Product Requirements Document
│   ├── TRD.md                  # Technical Requirements Document
│   ├── APP_FLOW.md             # End-to-end user/system flow
│   ├── BACKEND_SCHEMA.md       # Appwrite + in-memory data model reference
│   ├── IMPLEMENTATION_PLAN.md  # Build sequencing notes
│   └── UI_UX_BRIEF.md          # Frontend design brief
│
├── scratch/
│   └── seed_crowd_data.py      # Dev-only seed script for crowd reports
│
├── test_*.py                   # Backend test suite (see §9)
│
└── ReGenX/                     # Frontend application (Vite + React + TS)
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig*.json
    ├── .env.example            # Frontend-specific env vars
    ├── index.html
    ├── public/
    │   ├── firebase-messaging-sw.js   # FCM background service worker
    │   └── icons.svg / favicon.svg
    └── src/
        ├── main.tsx / App.tsx / App.css / index.css
        ├── assets/              # Static image assets (hero.png, etc.)
        ├── components/
        │   ├── auth/            # Login/register/role-gated components
        │   ├── citizen/         # Citizen dashboard (map, reports, safe places)
        │   ├── government/      # Government command center components
        │   ├── admin/           # System admin panel components
        │   ├── layout/          # Shared shell/navigation components
        │   └── map/             # Leaflet map rendering components
        ├── context/
        │   ├── AuthContext.tsx
        │   ├── DisasterDataContext.tsx
        │   ├── NotificationContext.tsx
        │   └── ThemeContext.tsx
        ├── data/
        │   ├── bmcWards.ts       # Static 67-ward reference data (frontend copy)
        │   └── mockDisasterData.ts
        ├── services/
        │   ├── api.ts            # Backend REST client
        │   ├── appwrite.ts       # Appwrite SDK client init
        │   ├── firebase.ts / fcmService.ts   # Push notification wiring
        │   └── locationService.ts
        └── types/index.ts        # Shared TypeScript types
```

> Omitted from tree: `node_modules/`, `package-lock.json` contents, `.git/`, `__pycache__/` (generated/heavy, not part of the authored codebase).

---

## 5. Prerequisites

| Requirement | Version / Notes |
|---|---|
| Python | 3.11+ recommended (`appwrite>=23.0.0`, `firebase-admin==6.5.0` — modern async-friendly Python) |
| Node.js | 18+ (required by Vite 8 / React 19 toolchain) |
| npm | bundled with Node |
| Appwrite instance | Cloud (`sgp.cloud.appwrite.io`) or self-hosted, with project + API key |
| Firebase project | For FCM push notifications (service account JSON) |
| Twilio account | Optional — only required if `SMS_ENABLED=true` |
| API keys | Tomorrow.io, Gemini (Google Generative AI), a Map provider, a News provider |

---

## 6. Environment Configuration

### Backend — `.env` (copy from `.env.example` in repo root)

```bash
# API Keys
TOMORROW_API_KEY="PASTE_YOUR_TOMORROW_API_KEY_HERE"
GEMINI_API_KEY="PASTE_YOUR_GEMINI_API_KEY_HERE"
MAP_API_KEY="PASTE_YOUR_MAP_API_KEY_HERE"
NEWS_API_KEY="PASTE_YOUR_NEWS_API_KEY_HERE"

# Appwrite
APPWRITE_API_KEY="PASTE_YOUR_APPWRITE_API_KEY_HERE"
APPWRITE_PROJECT_ID="PASTE_YOUR_APPWRITE_PROJECT_ID_HERE"
APPWRITE_ENDPOINT="https://sgp.cloud.appwrite.io/v1"

# Twilio (Optional)
TWILIO_ENABLED="true"
TWILIO_ACCOUNT_SID="PASTE_YOUR_TWILIO_ACCOUNT_SID_HERE"
TWILIO_API_KEY="PASTE_YOUR_TWILIO_API_KEY_HERE"
TWILIO_API_SECRET="PASTE_YOUR_TWILIO_API_SECRET_HERE"
TWILIO_FROM_NUMBER="PASTE_YOUR_TWILIO_FROM_NUMBER_HERE"
TWILIO_MESSAGING_SERVICE_SID=""

# SMS Safety Limits
SMS_ENABLED="false"
SMS_PROVIDER="twilio"
SMS_DAILY_LIMIT="50"
SMS_COOLDOWN_MINUTES="30"

# Firebase Cloud Messaging
FCM_ENABLED="true"
PUSH_PROVIDER="fcm"
FIREBASE_SERVICE_ACCOUNT_JSON_STRING=""
GOOGLE_APPLICATION_CREDENTIALS="apada-sathi-firebase-adminsdk.json"
FCM_PROJECT_ID="PASTE_YOUR_FIREBASE_PROJECT_ID_HERE"
FCM_CLIENT_EMAIL="PASTE_YOUR_FIREBASE_SERVICE_ACCOUNT_EMAIL_HERE"
FCM_PRIVATE_KEY="PASTE_YOUR_FIREBASE_PRIVATE_KEY_HERE"

# Appwrite Scheduled Function Orchestrator
SCHEDULER_ENABLED="true"
SCHEDULER_INTERVAL_MINUTES="20"
SCHEDULER_CRON="*/20 * * * *"

# Google OAuth2 (Citizen sign-in only)
GOOGLE_OAUTH_ENABLED="false"
GOOGLE_OAUTH_CLIENT_ID="PASTE_GOOGLE_OAUTH_CLIENT_ID_HERE"
GOOGLE_OAUTH_CLIENT_SECRET="PASTE_GOOGLE_OAUTH_CLIENT_SECRET_HERE"

# Government Official Mitigation Validity
OFFICIAL_OVERRIDE_DEFAULT_HOURS="6"

# Frontend Integration
ALLOWED_ORIGINS="https://nivaran-ai-delta.vercel.app,http://localhost:3000,http://127.0.0.1:3000"
```

### Frontend — `ReGenX/.env` (copy from `ReGenX/.env.example`)

> See `ReGenX/.env.example` in the repo for the exact frontend variable set (Appwrite/Firebase public config, API base URL). Populate with your own project credentials before running `npm run dev`.

**Never commit real `.env` files** — both `.gitignore` files already exclude them.

---

## 7. Installation & Local Setup

### 7.1 Clone the repository

```bash
git clone <your-repo-url> NivaranAI
cd NivaranAI
```

### 7.2 Backend setup (Flask API + Risk Engine)

```bash
# From the repository root
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# → edit .env with real API keys / Appwrite / Firebase / Twilio credentials

# Run the development server
python api.py
# or, for a production-style run:
gunicorn api:app
```

The Flask app exposes routes under `/api/*` (see §8). Default local port depends on how `api.py` is invoked (Flask's default `5000`, or the `PORT` env var under Gunicorn/Render).

### 7.3 Scheduled Risk Engine (optional, for local testing)

```bash
# Manually trigger one scoring cycle (does not loop — single-shot per invocation)
python scheduled_runner.py
```

In production this is intended to run via **Appwrite Scheduled Functions** on a `*/20 * * * *` cron, per `SCHEDULER_CRON` in `.env`.

### 7.4 Frontend setup (ReGenX — React + Vite)

```bash
cd ReGenX
npm install

cp .env.example .env
# → edit .env with Appwrite/Firebase public config and backend API URL

npm run dev
```

Vite's dev server will print the local URL (default `http://localhost:5173`).

### 7.5 Production build (frontend)

```bash
cd ReGenX
npm run build     # tsc -b && vite build
npm run preview   # serve the production build locally
```

### 7.6 Deployment (as configured in-repo)

- **Backend:** Render (`render.yaml`) — `pip install -r requirements.txt` then `gunicorn api:app`. Also compatible with any Procfile-based host (`web: gunicorn api:app`).
- **Frontend:** Deployed to Vercel (`nivaran-ai-delta.vercel.app`), referenced directly in `ALLOWED_ORIGINS`.

---

## 8. API Documentation & Endpoints

All endpoints are defined in `api.py`. Auth-required routes use a Bearer session token issued by `/api/auth/login` or `/api/auth/google`.

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user (citizen or official, pending approval for officials) | No |
| POST | `/api/auth/google` | Google OAuth sign-in (citizens only) | No |
| POST | `/api/auth/login` | Email/password login, returns session token | No |
| GET | `/api/auth/me` | Get current authenticated user's profile | Yes |
| GET | `/api/hazards` | Fetch current multi-hazard risk scores (all wards) | No |
| POST | `/api/evaluate-location` | Evaluate a specific lat/lon against active hazard zones (geofence check) | No |
| GET | `/api/safe-places` | List verified safe places near a location | No |
| POST | `/api/camps` | Create a government relief camp | Yes (Official) |
| PUT | `/api/camps/<camp_id>/capacity` | Update capacity of a relief camp | Yes (Official) |
| GET | `/api/reports` | List citizen-submitted ground reports | No |
| POST | `/api/reports` | Submit a new citizen ground report | Yes |
| POST | `/api/reports/<report_id>/verify` | Officially verify/reject a citizen report | Yes (Official) |
| POST | `/api/reports/<report_id>/corroborate` | Add corroboration to an existing report | Yes |
| GET | `/api/official-updates` | List official field mitigation updates | No |
| POST | `/api/official-updates` | Submit an official field mitigation update | Yes (Official) |
| GET | `/api/news` | Fetch localized disaster-related news | No |
| GET | `/api/admin/telemetry` | System health/execution telemetry | Yes (Admin) |
| GET | `/api/admin/users` | List platform users | Yes (Admin) |
| PUT | `/api/admin/users/<user_id>/approval` | Approve/suspend a pending official account | Yes (Admin) |
| GET | `/api/admin/audit-logs` | Retrieve immutable security audit log | Yes (Admin) |

> Role enforcement (`CITIZEN` / `GOVERNMENT_OFFICIAL` / `SYSTEM_ADMIN`) is performed server-side in `auth_service.py` via the `require_auth` / `optional_auth` decorators — frontend-supplied role claims are never trusted.

---

## 9. Testing & Quality Assurance

The backend ships a focused test suite (root-level `test_*.py`), covering integration points rather than a single unified pytest suite config:

```bash
# Activate your virtualenv first, then run individual test modules:
python test_auth.py
python test_appwrite.py
python test_emergency_locations.py
python test_map_and_crowd.py
python test_map_api_config.py
python test_news_service.py
python test_notifications.py
python test_scheduler.py
```

> If you introduce `pytest` as a runner, these can be collected with `pytest test_*.py` — no `pytest.ini`/`conftest.py` currently exists in the repo, so confirm compatibility before wiring into CI.

### Frontend linting

```bash
cd ReGenX
npm run lint     # oxlint
```

There is no dedicated frontend unit-test runner configured in `ReGenX/package.json` at this time — `npm run lint` is the only automated frontend QA step currently wired up.

---

## 10. Roadmap & Future Scope

Based on `docs/PRD.md` (`PLANNED / NOT VERIFIED` items) and natural extension points in the architecture:

- [ ] Comprehensive System Admin user-management dashboard UI (flagged as not-yet-verified in the PRD)
- [ ] Expand beyond Bhubaneswar's 67 wards to additional Municipal Corporations
- [ ] Regional language support for alert explanations and SMS templates
- [ ] Formal integration path with IMD / CWC / NDMA official data feeds and alerting protocols
- [ ] B2G licensing pathway for government adoption; B2B channels for utilities/logistics risk data
- [ ] Migrate `_ACTIVE_SESSIONS` / `_AUDIT_LOGS` from in-memory storage to persistent, horizontally-scalable storage for production reliability
- [ ] CI pipeline wiring the existing `test_*.py` suite and `oxlint` into pull-request checks

---

## 11. Team & Acknowledgements

**Team ReGenX** — Smart India Hackathon 2026
Problem Statement **SOAIDEATHON-S32** · *Hyperlocal Multi-Hazard Early-Warning Fusion with Uncertainty-Aware Action Guidance*

Built with data from **Open-Meteo**, **Tomorrow.io**, **Google Gemini**, **Firebase**, **Appwrite**, and **Twilio**. Ward vulnerability baselines reference the **BMC City Disaster Management Plan 2024**; population exposure figures reference **Census 2011 (BhubaneswarOne GIS)**, as documented in `risk_engine.py`.

Submitted as part of the official **Smart India Hackathon 2026** process.

---

