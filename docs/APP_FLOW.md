# Application Flow (APP_FLOW)

## 1. Citizen Flow (CITIZEN)

### 1.1 Authentication
- **Application Launch:** User opens the Nirvana AI dashboard.
- **Login / Register:** User chooses Email/Password or **Google Sign-In**. **(NOTE: There is NO OTP authentication in this system).**
- **Role Enforcement:** Backend automatically assigns the `CITIZEN` role. Google Sign-In is successful.

### 1.2 Dashboard & Map
- **Landing (Citizen Map):** User lands on the interactive Map interface.
- **View Hazards:** Visual hazard circles (Low, Mod, High, Emergency) are displayed over the 67 BMC Wards.
- **Locate Me / Evaluate:** User location is pinged; backend evaluates threat level. If affected, an alert is shown.
- **Safe Places:** User toggles "Safe Places Finder" to view nearby verified emergency locations, avoiding active hazard zones.

### 1.3 Crowd Reporting
- **Submit Report:** User observes an issue (e.g., Waterlogging). Submits a YES/NO report with optional photo and description.
- **Corroboration:** Report enters the cluster. Other citizens submitting nearby reports increase the "corroboration score".

### 1.4 News & Settings
- **Disaster News:** User navigates to the News feed to view ward-level or city-wide updates.
- **Settings:** User opens Notification Settings to configure SMS/Push preferences.
- **Logout:** Session token is invalidated.

## 2. Government Official Flow (GOVERNMENT_OFFICIAL)

### 2.1 Authentication & Approval
- **Registration Request:** Official signs up with Employee ID and Department via Email/Password.
- **Pending State:** Account is set to `PENDING`. Official *cannot* access the dashboard.
- **Admin Approval:** A System Admin approves the account -> `ACTIVE`.
- **Login:** Official logs in using Email/Password (Google Sign-In is strictly rejected).

### 2.2 Command Center
- **Landing (Gov Command Center):** Official views aggregate disaster telemetry and high-risk wards.
- **Report Triage:** Official views pending crowd reports. Official clicks **Verify** or **Reject** on a report, locking in the `VERIFIED` status which boosts its persistence.
- **Camp Management:** Official registers a new Government Camp, sets total capacity, and periodically updates occupied capacity.
- **Map View:** Official views the full map to visualize where mitigations are most needed.

## 3. System Administrator Flow (SYSTEM_ADMIN)

### 3.1 Authentication
- **Bootstrap / Login:** Admin provisions their account using the master `ADMIN_BOOTSTRAP_SECRET`. Logs in via Email/Password.

### 3.2 Admin Operations
- **Dashboard:** Admin lands on the overview panel.
- **User Management:** Admin reviews pending Government Officials. Clicks **Approve** or **Suspend**.
- **Scheduler & Health:** Admin checks the health of the backend execution chron jobs (`scheduled_runner.py`).
- **Audit Logs:** Admin views immutable security logs to monitor platform usage and block malicious activity.

## 4. System / Background Flows

### 4.1 Notification Flow
- **Trigger:** Risk Engine recalculates scores.
- **Evaluation:** If a ward hits `HIGH` or `EMERGENCY` severity, users located within the `affected_radius_km` are identified.
- **Dispatch:** System attempts to route Push Notifications via Firebase FCM and informational (non-auth) alerts via Twilio SMS.

### 4.2 Error Flows
- **Auth Failure:** Invalid session returns `401 Unauthorized`. Client redirects to Login.
- **Permission Denial:** Citizen trying to access Gov endpoints receives `403 Forbidden`.
- **API Rate Limit:** If Tomorrow.io hits 429, backend falls back to in-memory cache or Open-Meteo.
