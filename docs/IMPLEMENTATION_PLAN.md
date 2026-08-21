# Implementation Plan (IMPLEMENTATION_PLAN)

## 1. Overview
The Nirvana AI (Apada Sathi) project is in an advanced state of development. The core intelligence (Risk Engine), backend API, and React frontend are tightly integrated and functional.

## 2. Already Implemented & Integrated

### 2.1 Backend Core
- **Authentication:** Custom JWT-like session management (`auth_service.py`), strictly enforcing `CITIZEN`, `GOVERNMENT_OFFICIAL`, and `SYSTEM_ADMIN` roles.
- **Risk Engine:** (`risk_engine.py`) fully implemented for 67 BMC wards with mathematical formulas combining Open-Meteo and Tomorrow.io telemetry.
- **Map Zones:** (`map_zones.py`) dynamically computes UI-ready circular radii based on severity and risk scores.
- **Crowd Reports:** (`crowd_updates.py`) robustly handles citizen reports, corroboration logic (clustering based on location and time), and Appwrite schema sync.
- **Background Scheduler:** (`scheduled_runner.py`) framework built for cron-based background jobs.
- **News Service:** (`news_service.py`) ready to aggregate disaster news.

### 2.2 Frontend Core
- **React App:** Vite + React + TailwindCSS application located in `ReGenX/`.
- **UI Components:** Role-based conditional rendering (Citizen Dashboard, Govt Command Center, Admin Dashboard).
- **Map Integration:** Leaflet configured for visualizing `map_zones.py` outputs.

### 2.3 External Integrations
- **Appwrite:** Successfully integrated via `appwrite` python SDK for persistent spatial data.
- **Weather APIs:** Open-Meteo and Tomorrow.io natively called inside `risk_engine.py`.

## 3. Deployment-Ready Components
- The Flask backend is structured to run via Gunicorn (`requirements.txt`).
- CORS is dynamically configured via `ALLOWED_ORIGINS` making frontend-backend communication secure.
- Frontend build process (`npm run build`) is fully operational.

## 4. Remaining Work & Future Improvements

### 4.1 Persistence Migration
- **Current State:** User records, sessions, and audit logs sit in memory (`_USER_DATABASE` in `auth_service.py`).
- **Action:** Migrate these data structures to Appwrite collections or a PostgreSQL database to ensure state survives server restarts.

### 4.2 Credential Provisioning (Notifications)
- **Current State:** `sms_service.py` and `notification_provider.py` outline the logic for Twilio and Firebase FCM integrations.
- **Action:** Obtain and inject real, production-ready `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `firebase-adminsdk.json` credentials securely via environment variables to test live push/SMS targeting.

### 4.3 Google OAuth Frontend Integration
- **Current State:** Backend supports `google_oauth` auth provider for citizens.
- **Action:** Wire up the Firebase Google Auth provider on the React frontend to pass the acquired token to the backend `/api/auth/login` route.

### 4.4 DevOps & CI/CD
- **Action:** Containerize the application using Docker.
- **Action:** Deploy backend to a cloud provider (e.g., AWS, GCP, Render) and frontend to a CDN (e.g., Vercel, Netlify).
