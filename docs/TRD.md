# Technical Requirements Document (TRD)

## 1. Overall Architecture
Nirvana AI (Apada Sathi) utilizes a decoupled client-server architecture:
- **Frontend:** Single Page Application (SPA) built with React, Vite, and Tailwind CSS.
- **Backend:** RESTful API built with Python and Flask.
- **Database/BaaS:** Appwrite for persistent storage of users, map data, and crowd reports; in-memory structures for stateless active sessions.

## 2. Frontend Architecture
- **Framework:** React 19 with Vite (`ReGenX/` directory).
- **Styling:** Tailwind CSS v4, Lucide React icons.
- **Map Rendering:** Leaflet (via `leaflet` package).
- **State Management:** React Context (`ThemeContext`, `AuthContext`, `DisasterDataContext`, `NotificationContext`).
- **Push Notifications:** Firebase SDK (`firebase` package).
- **Routing:** Conditional component rendering based on Auth Context (`Role`).

## 3. Backend Architecture
- **Framework:** Flask 3.0+
- **Entry Point:** `api.py` serving REST endpoints.
- **Core Modules:**
  - `auth_service.py`: JWT-like session management, RBAC, and Appwrite-backed user registry (using raw `requests` bypass for dynamic Appwrite serialization).
  - `risk_engine.py`: Heart of the system. Fetches from Open-Meteo and Tomorrow.io, calculates risk scores for 67 BMC wards.
  - `map_zones.py`: Transforms risk engine outputs into frontend map layers.
  - `crowd_updates.py`: Manages Appwrite connection, corroboration clustering, and time decay.
  - `emergency_locations.py`: Manages safe places and government camps via Appwrite.
  - `news_service.py`: Localized disaster news aggregation.
  - `scheduled_runner.py`: Telemetry and cron-like background tasks.
  - `sms_service.py` & `notification_provider.py`: Twilio & Firebase integration handlers.

## 4. Third-Party Integrations
- **Appwrite (IMPLEMENTED):** Used for persistent tables (`users`, `crowd_updates`, `risk_zones`, `emergency_locations`). Configured via `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`.
- **Firebase/FCM (IMPLEMENTED / PENDING REAL CREDS):** Push notifications handled via `firebase-admin` in Python and `firebase` in React. Configured via service account JSON. Google Auth ID token validation is also routed through Firebase Admin.
- **Twilio (IMPLEMENTED / PENDING REAL CREDS):** SMS dispatch. Configured via `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`.
- **Open-Meteo (IMPLEMENTED):** Primary public weather API (no key required).
- **Tomorrow.io (IMPLEMENTED):** Secondary weather/lightning API (requires API key).
- **Google Generative AI (IMPLEMENTED):** Used for hazard explanation generation.

## 5. Security Architecture
- **CORS:** Configured in `api.py` via `ALLOWED_ORIGINS` environment variable.
- **Authentication:** Custom Bearer tokens (`sess_...`) mapped to server-side sessions. Passwords are natively hashed via SHA-256 and salted, securely mapped inside Appwrite.
- **Role-Based Access Control (RBAC):** Middleware `@require_auth` ensures route protection. Roles are strictly validated server-side.
- **Audit Logging:** Immutable logging system (`record_audit_event`) tracking all sensitive actions (e.g., `ADMIN_APPROVED_OFFICIAL`, `USER_LOGIN`).

## 6. Dependency Management
- **Frontend:** `npm` (`package.json`, `package-lock.json`).
- **Backend:** `pip` (`requirements.txt`).

## 7. Current Technical Limitations
- Audit logs and sessions (`_ACTIVE_SESSIONS`, `_AUDIT_LOGS`) still reside in memory to optimize read/write IO during intense auth-spikes, meaning active sessions expire on server restart. User persistence, however, is fully SQL/NoSQL backed by Appwrite.
