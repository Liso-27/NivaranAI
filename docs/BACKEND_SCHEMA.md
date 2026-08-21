# Backend Schema (BACKEND_SCHEMA)

## 1. Overview
The Nirvana AI (Apada Sathi) backend employs a hybrid schema architecture:
- **Appwrite Database:** Persistent storage for Users, Authentication, Roles, Crowd-sourced reports, and Emergency Locations.
- **In-Memory Storage:** Sessions and immutable Audit Logs.
- **Hardcoded Constants:** Risk Engine logic, BMC ward definitions, and static susceptibility layers.

## 2. In-Memory Entities (Defined in `auth_service.py`)

### 2.1 Sessions (`_ACTIVE_SESSIONS`)
- **Key:** `session_token` (String)
- **Fields:** `user_id`, `role`, `status`, `created_at`, `expires_at`

### 2.2 Audit Logs (`_AUDIT_LOGS`)
- **Type:** List of Dictionaries
- **Fields:** `event_id`, `actor_user_id`, `actor_role`, `action`, `target_id`, `result`, `metadata` (sanitized), `timestamp`

## 3. Appwrite Entities

### 3.1 Users (`users` collection)
- **Defined in:** `auth_service.py` / `AppwriteUserDB`
- **Fields:**
  - `user_id` (String) - Primary Key
  - `email` (String) - Indexed for quick login lookup
  - `name` (String)
  - `role` (String) - Enum: `CITIZEN`, `GOVERNMENT_OFFICIAL`, `SYSTEM_ADMIN`
  - `status` (String) - Enum: `PENDING`, `ACTIVE`, `SUSPENDED`
  - `auth_provider` (String) - `local` or `google`
  - `phone_number` (String, Optional)
  - `password_hash` (String, internal, SHA-256)
  - `password_salt` (String, internal)
  - `google_user_id` (String, Optional)
  - `department` (String, Optional) - Government Official only
  - `designation` (String, Optional) - Government Official only
  - `employee_id` (String, Optional) - Government Official only
  - `sms_opt_out` (Boolean)
  - `sms_enabled` (Boolean)
  - `created_at` (ISO DateTime)

### 3.2 Crowd Updates (`crowd_updates` table)
- **Defined in:** `crowd_updates.py`
- **Fields:**
  - `user_id` (String, size 100)
  - `ward_id` (String, size 50)
  - `latitude` (Float, Required)
  - `longitude` (Float, Required)
  - `update_type` (String, size 50, Required) - e.g., `waterlogging`, `road_damage`
  - `answer` (String, size 10, Required) - `YES`, `NO`, `UNKNOWN`
  - `description` (String, size 1000)
  - `photo_url` (String, size 1000)
  - `status` (String, size 20, Required) - `PENDING`, `VERIFIED`, `REJECTED`
  - `confirm_count` (Integer)
  - `false_report_count` (Integer)

### 3.3 Risk Zones (`risk_zones` table)
- **Defined in:** Expected in Appwrite, queried via `map_zones.py`.
- **Fields (Inferred):**
  - `ward_id`, `ward_name`, `hazard_type`, `risk_score`, `severity`, `confidence`, `notify_user`, `notification_type`, `show_safe_place`.

### 3.4 Emergency Locations (`emergency_locations` table)
- **Defined in:** `emergency_locations.py`
- **Fields:**
  - `name`, `type`, `latitude`, `longitude`, `address`, `ward_id`, `status` (`ACTIVE`, `CLOSED`, `FULL`), `capacity`, `available_capacity`, `is_government_verified`.

## 4. Hardcoded Entities

### 4.1 Ward Data (`risk_engine.py`)
- **Structure:** Dictionary containing 67 BMC wards.
- **Fields:**
  - `name` (String, e.g., "Ward 1")
  - `lat`, `lon` (Float, coordinates)
  - `static_layers` (Dictionary):
    - `flood_susceptibility` (0-100 scale)
    - `waterlogging_susceptibility` (0-100 scale)
    - `population_exposure` (0-100 scale based on census)
