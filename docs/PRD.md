# Product Requirements Document (PRD)

## 1. Product Overview
- **Product Name:** Nirvana AI (Internal Project Name: Apada Sathi)
- **Product Purpose:** A comprehensive multi-hazard risk engine, interactive map dashboard, and real-time disaster management platform.
- **Problem Statement:** During urban disasters, citizens lack localized real-time hazard data and verified safe places, while government officials lack consolidated telemetry and verified ground reports to coordinate response efforts.

## 2. Target Users & Roles
- **Citizen (CITIZEN):** Public users seeking safety information, map visualizations, and contributing ground reports.
- **Government Official (GOVERNMENT_OFFICIAL):** Authorized personnel managing field mitigations, verifying crowd reports, and overseeing emergency camps.
- **System Administrator (SYSTEM_ADMIN):** Technical personnel managing the platform, auditing logs, and approving official accounts.

## 3. Functional Requirements

### 3.1 Citizen Requirements
- **IMPLEMENTED:** User registration and login (Email/Password).
- **IMPLEMENTED:** Google Sign-In (Restricted strictly to Citizens).
- **IMPLEMENTED:** View multi-hazard map dashboard with visual risk zones.
- **IMPLEMENTED:** Locate verified safe places and emergency camps based on current location.
- **IMPLEMENTED:** Submit crowd-sourced disaster reports (e.g., waterlogging, road damage, heavy rain) with YES/NO/UNKNOWN answers.
- **IMPLEMENTED:** View localized disaster news and updates.
- **IMPLEMENTED:** Update location telemetry to receive contextual warnings.

### 3.2 Government Official Requirements
- **IMPLEMENTED:** Secure registration (Email/Password only) requiring System Admin approval. (Status: PENDING -> ACTIVE).
- **IMPLEMENTED:** Government Command Center dashboard.
- **IMPLEMENTED:** Verify or reject citizen crowd reports to update corroboration scores.
- **IMPLEMENTED:** Submit official field updates and mitigation statuses (CONFIRMED, FULLY_MITIGATED, etc.).
- **IMPLEMENTED:** Create and manage capacity of government relief camps.

### 3.3 System Administrator Requirements
- **IMPLEMENTED:** Secure bootstrap provisioning via master secret key.
- **IMPLEMENTED:** Approve or suspend pending Government Official accounts.
- **IMPLEMENTED:** View system telemetry, execution health, and immutable security audit logs.
- **PLANNED / NOT VERIFIED:** Comprehensive user management dashboard UI.

### 3.4 Risk Engine & Map Requirements
- **IMPLEMENTED:** Multi-hazard evaluation for 5 hazard types: Heavy Rainfall, Flood, Waterlogging, Lightning, Cyclone.
- **IMPLEMENTED:** Coverage for 67 BMC (Bhubaneswar Municipal Corporation) Wards.
- **IMPLEMENTED:** Severity categorization: LOW (0-30), MODERATE (31-55), HIGH (56-80), EMERGENCY (81-100).
- **IMPLEMENTED:** Algorithmic visualization radius (`affected_radius_km`) calculation for map rendering.

### 3.5 Notification Requirements
- **IMPLEMENTED:** Rule-based notification logic (Notify user if HIGH or EMERGENCY severity).
- **IMPLEMENTED:** Push notification targeting payloads generation.
- **PLANNED / NOT VERIFIED:** Actual SMS dispatch (Twilio integration configured but requires real credentials).
- **PLANNED / NOT VERIFIED:** Actual Push dispatch to devices (FCM integration configured but requires valid tokens).

## 4. Non-Functional Requirements
- **Security:** Immutable audit logs; no password or secret leakage; strict server-side role enforcement.
- **Performance:** Appwrite for persistent spatial/crowd data; in-memory caching for API limits (Tomorrow.io).
- **Reliability:** Fallback logic if external APIs (Open-Meteo, Tomorrow.io, Appwrite) fail.

## 5. Current Limitations
- User database is currently stored in-memory in the backend (`_USER_DATABASE`), which resets on server restart.
- Google OAuth is strictly for citizens and implemented in the backend, requiring frontend integration to pass proper tokens.
