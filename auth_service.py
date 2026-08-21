"""
Apada Sathi - Final Backend Authentication & Role-Based Authorization System
=============================================================================

Implements server-side authentication, role-based authorization, account management,
official field mitigations, government camp management, and security audit logging.

ROLES:
1. CITIZEN (Email/Password, Google OAuth, Map, News, Safe Places, Crowd Reporting)
2. GOVERNMENT_OFFICIAL (Email/Password ONLY, Status: PENDING -> ACTIVE -> SUSPENDED,
   Verify Crowd Reports, Submit Field Mitigations, Manage Government Camps)
3. SYSTEM_ADMIN (Email/Password ONLY, Approve/Suspend Officials, View Health & Audit Logs)

CRITICAL SECURITY & ARCHITECTURAL CONSTRAINTS:
- risk_engine.py is the HEART of the system and is NEVER modified.
- Backend verifies authentication & roles server-side; NEVER trust frontend role inputs.
- Google Sign-In is STRICTLY available for CITIZEN ONLY.
- Government Officials & System Admins MUST use protected credential authentication.
- Official mitigations do NOT overwrite analytical risk scores; stored as separate layer.
- Never logs or exposes passwords, API keys, or OAuth secrets.
"""

from datetime import datetime, timezone, timedelta
import hashlib
import hmac
import os
import re
from dotenv import load_dotenv

load_dotenv()

_SESSION_TTL_HOURS = int(os.getenv("SESSION_TTL_HOURS", "24"))
ADMIN_BOOTSTRAP_SECRET = os.getenv("ADMIN_BOOTSTRAP_SECRET", "")
import secrets
from typing import Any, Dict, List, Optional, Set, Tuple, Union

import risk_engine
import map_zones
import emergency_locations as el
import crowd_updates
import sms_service

# Firebase Admin Init for Google Auth
import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials

if not firebase_admin._apps:
    try:
        # Expect service account path in env or default to root file
        creds_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "firebase-adminsdk.json")
        if os.path.exists(creds_path):
            cred = credentials.Certificate(creds_path)
            firebase_admin.initialize_app(cred)
        else:
            print("WARNING: firebase-adminsdk.json not found. Google Auth backend verification may fail.")
    except Exception as e:
        print(f"Firebase Init Error: {e}")

# Appwrite Users Database Wrappers
import requests

def _appwrite_headers():
    return {
        "x-appwrite-project": os.environ.get("APPWRITE_PROJECT_ID", "6a842a71002b825e7612"),
        "x-appwrite-key": os.environ.get("APPWRITE_API_KEY"),
        "content-type": "application/json"
    }

def _appwrite_endpoint():
    return os.environ.get("APPWRITE_ENDPOINT", "https://sgp.cloud.appwrite.io/v1").rstrip("/")

import requests

def _appwrite_headers():
    return {
        "x-appwrite-project": os.environ.get("APPWRITE_PROJECT_ID", "6a842a71002b825e7612"),
        "x-appwrite-key": os.environ.get("APPWRITE_API_KEY"),
        "content-type": "application/json"
    }

def _appwrite_endpoint():
    return os.environ.get("APPWRITE_ENDPOINT", "https://sgp.cloud.appwrite.io/v1").rstrip("/")

class AppwriteUserDB:
    def get(self, user_id, default=None):
        if not user_id: return default
        url = f"{_appwrite_endpoint()}/databases/{el.DATABASE_ID}/collections/users/documents/{user_id}"
        try:
            resp = requests.get(url, headers=_appwrite_headers())
            if resp.status_code == 200:
                doc = resp.json()
                doc["id"] = doc.get("$id")
                doc["user_id"] = doc.get("$id")
                return doc
        except Exception:
            pass
        return default

    def __getitem__(self, user_id):
        user = self.get(user_id)
        if not user: raise KeyError(user_id)
        return user

    def __setitem__(self, user_id, user_dict):
        url = f"{_appwrite_endpoint()}/databases/{el.DATABASE_ID}/collections/users/documents/{user_id}"
        user_dict["id"] = user_id
        user_dict["user_id"] = user_id
        data = dict(user_dict)
        for k in ["$id", "id", "$permissions", "$collectionId", "$databaseId", "$createdAt", "$updatedAt"]:
            data.pop(k, None)
            
        try:
            resp = requests.patch(url, headers=_appwrite_headers(), json={"data": data})
            if resp.status_code == 404:
                url_create = f"{_appwrite_endpoint()}/databases/{el.DATABASE_ID}/collections/users/documents"
                c_resp = requests.post(url_create, headers=_appwrite_headers(), json={"documentId": str(user_id), "data": data})
                if c_resp.status_code not in (200, 201):
                    print(f"Appwrite DB Create Error: {c_resp.status_code} {c_resp.text}")
            elif resp.status_code not in (200, 201):
                print(f"Appwrite DB Update Error: {resp.status_code} {resp.text}")
        except Exception as e:
            print(f"Error saving user to Appwrite via requests: {e}")

    def __contains__(self, user_id):
        return self.get(user_id) is not None

    def values(self):
        url = f"{_appwrite_endpoint()}/databases/{el.DATABASE_ID}/collections/users/documents"
        try:
            resp = requests.get(f"{url}?limit=100", headers=_appwrite_headers())
            if resp.status_code == 200:
                docs = resp.json().get("documents", [])
                for doc in docs:
                    doc["id"] = doc.get("$id")
                    doc["user_id"] = doc.get("$id")
                return docs
        except Exception as e:
            print("AppwriteUserDB values error:", e)
        return []

    def clear(self):
        test_emails = {
            'bmc.officer@odisha.gov.in', 'inv1@example.com', 'o_suspend@bmc.gov.in', 
            'cit_b@example.com', 'loc_citizen@example.com', 'citizen1@example.com', 
            'o_review@bmc.gov.in', 'hacker.google@gmail.com', 'phone_citizen@example.com', 
            'o2_mitig@bmc.gov.in', 'o_mitig@bmc.gov.in', 'inv2@example.com', 
            'c_guard@example.com', 'coord_cit@example.com', 'cit_a@example.com', 
            'norm2@example.com', 'fake_gov@example.com', 'citizen.google@gmail.com', 
            'admin@apadasathi.gov.in', 'audit_user@example.com', 'o_camp@bmc.gov.in', 
            'o_guard@bmc.gov.in', 'norm1@example.com', 'hacker_admin@example.com'
        }
        url = f"{_appwrite_endpoint()}/databases/{el.DATABASE_ID}/collections/users/documents"
        try:
            resp = requests.get(f"{url}?limit=100", headers=_appwrite_headers())
            if resp.status_code == 200:
                docs = resp.json().get("documents", [])
                for doc in docs:
                    email = doc.get("email", "").strip().lower()
                    if email in test_emails:
                        doc_id = doc.get("$id")
                        del_url = f"{url}/{doc_id}"
                        requests.delete(del_url, headers=_appwrite_headers())
        except Exception as e:
            print("AppwriteUserDB clear error:", e)


class AppwriteEmailIndex:
    def get(self, email, default=None):
        if not email: return default
        url = f"{_appwrite_endpoint()}/databases/{el.DATABASE_ID}/collections/users/documents"
        try:
            resp = requests.get(url, headers=_appwrite_headers())
            if resp.status_code == 200:
                docs = resp.json().get("documents", [])
                for doc in docs:
                    if doc.get("email", "").strip().lower() == str(email).strip().lower():
                        return doc.get("$id", default)
        except Exception as e:
            print("AppwriteEmailIndex Error:", e)
        return default

    def __contains__(self, email):
        return self.get(email) is not None

    def __getitem__(self, email):
        val = self.get(email)
        if not val: raise KeyError(email)
        return val

    def __setitem__(self, email, user_id):
        pass

    def clear(self):
        pass

_USER_DATABASE = AppwriteUserDB()
_USER_EMAIL_INDEX = AppwriteEmailIndex()
_ACTIVE_SESSIONS: Dict[str, Dict[str, Any]] = {}
_OFFICIAL_FIELD_UPDATES: Dict[str, Dict[str, Any]] = {}
_AUDIT_LOGS: List[Dict[str, Any]] = []

SESSION_TTL_HOURS = int(os.environ.get("SESSION_TTL_HOURS", "24"))

ROLE_CITIZEN = "CITIZEN"
ROLE_GOVERNMENT_OFFICIAL = "GOVERNMENT_OFFICIAL"
ROLE_SYSTEM_ADMIN = "SYSTEM_ADMIN"

STATUS_PENDING = "PENDING"
STATUS_ACTIVE = "ACTIVE"
STATUS_SUSPENDED = "SUSPENDED"

OFFICIAL_FULLY_MITIGATED = "FULLY_MITIGATED"
OFFICIAL_PARTIALLY_MITIGATED = "PARTIALLY_MITIGATED"
OFFICIAL_RESOLVED = "RESOLVED"
OFFICIAL_CONFIRMED = "CONFIRMED"

ALLOWED_OFFICIAL_STATUSES = {
    OFFICIAL_CONFIRMED,
    OFFICIAL_PARTIALLY_MITIGATED,
    OFFICIAL_FULLY_MITIGATED,
    OFFICIAL_RESOLVED,
    "INCORRECT_REPORT",
    "DISPUTED"
}

VERIF_OFFICIAL_REPORTED = "OFFICIAL_REPORTED"
VERIF_OFFICIALLY_VERIFIED = "OFFICIALLY_VERIFIED"
VERIF_DISPUTED = "DISPUTED"

OFFICIAL_OVERRIDE_DEFAULT_HOURS = int(os.environ.get("OFFICIAL_OVERRIDE_DEFAULT_HOURS", "6"))


def _hash_password(password: str, salt: str) -> str:
    import hashlib
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def _verify_password(password: str, stored_hash: str, salt: str) -> bool:
    return _hash_password(password, salt) == stored_hash

def record_audit_event(
    actor_user_id: Optional[str] = None,
    actor_role: Optional[str] = None,
    action: Optional[str] = None,
    target_id: Optional[str] = None,
    result: str = "SUCCESS",
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    """Records an immutable security audit event in memory."""
    global _AUDIT_LOGS
    event = {
        "audit_id": f"audit_{secrets.token_hex(8)}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "actor_user_id": str(actor_user_id) if actor_user_id else None,
        "actor_role": str(actor_role) if actor_role else None,
        "action": str(action) if action else None,
        "target_id": str(target_id) if target_id else None,
        "result": str(result) if result else "SUCCESS",
        "metadata": metadata or {},
    }
    _AUDIT_LOGS.append(event)


def get_audit_logs(limit: int = 100) -> List[Dict[str, Any]]:
    """Retrieves the latest audit log records."""
    global _AUDIT_LOGS
    return list(_AUDIT_LOGS)[-limit:]


def _normalize_phone_number(phone: Optional[str]) -> Tuple[bool, Optional[str]]:
    """Validates and normalizes Indian phone numbers to E.164 (+91) format."""
    if not phone:
        return True, None
    phone_str = str(phone).strip()
    if not phone_str:
        return True, None
    
    cleaned = re.sub(r'[\s\(\)\-]', '', phone_str)
    
    if cleaned.startswith("+91"):
        digits = cleaned[3:]
        if len(digits) == 10 and digits.isdigit():
            return True, f"+91{digits}"
        return False, None
    elif cleaned.startswith("91") and len(cleaned) == 12 and cleaned.isdigit():
        return True, f"+{cleaned}"
    elif len(cleaned) == 10 and cleaned.isdigit():
        return True, f"+91{cleaned}"
    else:
        return False, None


def register_citizen(name: str = "", email: str = "", password: str = "", phone_number: str = None, client_supplied_role: str = None) -> dict:
    global _USER_DATABASE, _USER_EMAIL_INDEX
    clean_email = str(email).strip().lower()
    
    if _USER_EMAIL_INDEX.get(clean_email):
        return {"success": False, "error": "Email already in use", "status_code": 409}
        
    norm_phone = None
    if phone_number is not None:
        valid_p, norm_p = _normalize_phone_number(phone_number)
        if not valid_p:
            return {"success": False, "error": "Invalid phone number format", "status_code": 400}
        norm_phone = norm_p
        
    import secrets
    from datetime import datetime, timezone
    salt = secrets.token_hex(16)
    password_hash = _hash_password(password, salt)
    
    user_id = f"user_{secrets.token_hex(8)}"
    
    user = {
        "id": user_id,
        "name": name,
        "email": clean_email,
        "phone_number": norm_phone,
        "role": ROLE_CITIZEN,
        "status": STATUS_ACTIVE,
        "auth_provider": "local",
        "password_hash": password_hash,
        "password_salt": salt,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "sms_opt_out": False,
        "sms_enabled": True
    }
    
    _USER_DATABASE[user_id] = user
    
    record_audit_event(
        actor_user_id=user_id,
        actor_role=ROLE_CITIZEN,
        action="USER_REGISTERED",
        target_id=user_id,
        result="SUCCESS"
    )
    
    return {
        "success": True,
        "message": "Citizen registered successfully",
        "user_id": user_id,
        "role": ROLE_CITIZEN,
        "status": STATUS_ACTIVE,
        "name": name,
        "email": clean_email,
        "phone_number": norm_phone,
        "status_code": 201
    }


def update_citizen_phone_and_preferences(
    user_id: Optional[str] = None,
    session_token: Optional[str] = None,
    phone_number: Optional[str] = None,
    sms_opt_out: Optional[bool] = None,
    sms_enabled: Optional[bool] = None,
    **kwargs
) -> Dict[str, Any]:
    global _USER_DATABASE
    target_id = user_id
    if session_token:
        sess = verify_session(session_token)
        if not sess:
            return {"success": False, "error": "Invalid or expired session token", "status_code": 401}
        target_id = sess["user_id"]
    
    if not target_id:
        return {"success": False, "error": "Missing user identifier", "status_code": 400}
        
    user = _USER_DATABASE.get(target_id)
    if not user:
        return {"success": False, "error": "User not found", "status_code": 404}
        
    norm_p = user.get("phone_number")
    if phone_number is not None:
        valid_p, norm_p = _normalize_phone_number(phone_number)
        if not valid_p:
            return {"success": False, "error": "Invalid phone number format", "status_code": 400}
        user["phone_number"] = norm_p
        
    if sms_opt_out is not None:
        user["sms_opt_out"] = bool(sms_opt_out)
        user["sms_enabled"] = not bool(sms_opt_out)
    elif sms_enabled is not None:
        user["sms_enabled"] = bool(sms_enabled)
        user["sms_opt_out"] = not bool(sms_enabled)
        
    user["updated_at"] = datetime.now(timezone.utc).isoformat()
    _USER_DATABASE[target_id] = user
    
    record_audit_event(
        actor_user_id=target_id,
        actor_role=user.get("role", ROLE_CITIZEN),
        action="USER_PREFERENCES_UPDATED",
        target_id=target_id,
        result="SUCCESS"
    )
    
    return {
        "success": True,
        "message": "Preferences updated successfully",
        "user_id": target_id,
        "phone_number": norm_p,
        "sms_opt_out": user.get("sms_opt_out", False),
        "sms_enabled": user.get("sms_enabled", True),
        "status_code": 200,
    }


def update_citizen_location(
    session_token: str,
    latitude: float,
    longitude: float,
    target_user_id: Optional[str] = None,
    **kwargs
) -> Dict[str, Any]:
    global _USER_DATABASE
    sess = verify_session(session_token)
    if not sess:
        return {"success": False, "error": "Invalid or expired session token", "status_code": 401}
        
    auth_user_id = sess["user_id"]
    
    if target_user_id and target_user_id != auth_user_id:
        return {"success": False, "error": "Unauthorized: Cannot update location of another user", "status_code": 403}
        
    try:
        lat = float(latitude)
        lon = float(longitude)
    except (ValueError, TypeError):
        return {"success": False, "error": "Invalid numeric coordinates", "status_code": 400}
        
    if lat < -90.0 or lat > 90.0 or lon < -180.0 or lon > 180.0:
        return {"success": False, "error": "Coordinates out of bounds (-90 to 90 lat, -180 to 180 lon)", "status_code": 400}
        
    user = _USER_DATABASE.get(auth_user_id)
    if not user:
        return {"success": False, "error": "User not found", "status_code": 404}
        
    now_iso = datetime.now(timezone.utc).isoformat()
    user["latitude"] = lat
    user["longitude"] = lon
    user["last_location_updated_at"] = now_iso
    user["updated_at"] = now_iso
    
    _USER_DATABASE[auth_user_id] = user
    
    record_audit_event(
        actor_user_id=auth_user_id,
        actor_role=user.get("role", ROLE_CITIZEN),
        action="USER_LOCATION_UPDATED",
        target_id=auth_user_id,
        result="SUCCESS"
    )
    
    return {
        "success": True,
        "message": "Location updated successfully",
        "user_id": auth_user_id,
        "latitude": lat,
        "longitude": lon,
        "status_code": 200,
    }

def authenticate_google_user(google_email, google_user_id, name, client_supplied_role=None):
    global _USER_DATABASE, _USER_EMAIL_INDEX
    clean_email = str(google_email).strip().lower()
    user_id = _USER_EMAIL_INDEX.get(clean_email)
    
    if user_id:
        user = _USER_DATABASE.get(user_id)
        if user and user.get("role") != ROLE_CITIZEN:
            return {"success": False, "error": "Google Sign-In is for Citizens only", "status_code": 403}
        if user and user.get("status") == STATUS_SUSPENDED:
            return {"success": False, "error": "Account suspended", "status_code": 403}
    else:
        import secrets
        from datetime import datetime, timezone
        user_id = f"user_{secrets.token_hex(8)}"
        user = {
            "id": user_id,
            "name": name,
            "email": clean_email,
            "role": ROLE_CITIZEN,
            "status": STATUS_ACTIVE,
            "auth_provider": "google",
            "google_user_id": google_user_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "sms_opt_out": False,
            "sms_enabled": True
        }
        _USER_DATABASE[user_id] = user
        
    session = _create_session(user)
    return {
        "success": True,
        "session_token": session["token"],
        "user": _sanitize_user_profile(user),
        "status_code": 200
    }

def authenticate_google_user_from_token(id_token: str) -> Dict[str, Any]:
    """
    Verifies a Firebase ID token and authenticates/creates the Citizen user.
    """
    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests
        
        project_id = os.environ.get("FIREBASE_PROJECT_ID", "apada-sathi-271b0")
        req = google_requests.Request()
        
        decoded_token = google_id_token.verify_firebase_token(
            id_token,
            req,
            audience=project_id
        )
        google_uid = decoded_token.get("uid") or decoded_token.get("sub")
        email = decoded_token.get("email")
        name = decoded_token.get("name", "Google User")
        
        if not email or not google_uid:
            return {"success": False, "error": "Invalid token payload (missing email/uid)", "status_code": 400}
            
        return authenticate_google_user(google_email=email, google_user_id=google_uid, name=name)
    except Exception as e:
        import traceback
        print(f"Token verification failed [{type(e).__name__}]: {e}")
        traceback.print_exc()
        return {"success": False, "error": "Invalid or expired Google token", "status_code": 401}

# ==============================================================================
# GOVERNMENT OFFICIAL & SYSTEM ADMIN MANAGEMENT
# ==============================================================================

def register_government_official_request(
    email: str,
    password: str,
    name: str,
    department: str,
    designation: str,
    employee_id: str,
) -> Dict[str, Any]:
    """
    Submits a Government Official account registration request.

    Guarantees:
    - Creates account in PENDING status.
    - Cannot access protected government endpoints until approved by a SYSTEM_ADMIN.
    - Password protected (NO Google Sign-In).
    """
    global _USER_DATABASE, _USER_EMAIL_INDEX
    clean_email = str(email).strip().lower()

    if not clean_email or "@" not in clean_email:
        return {"success": False, "error": "Invalid official email", "status_code": 400}
    if not password or len(password) < 8:
        return {"success": False, "error": "Official password must be at least 8 characters", "status_code": 400}
    if clean_email in _USER_EMAIL_INDEX:
        return {"success": False, "error": "An account with this email already exists", "status_code": 409}

    salt = secrets.token_hex(16)
    pw_hash = _hash_password(password, salt)
    user_id = f"official_{secrets.token_hex(8)}"
    now_iso = datetime.now(timezone.utc).isoformat()

    user_record = {
        "user_id": user_id,
        "email": clean_email,
        "name": str(name).strip(),
        "department": str(department).strip(),
        "designation": str(designation).strip(),
        "employee_id": str(employee_id).strip(),
        "role": ROLE_GOVERNMENT_OFFICIAL,
        "status": STATUS_PENDING,  # Requires Admin Approval
        "auth_provider": "email_password",
        "password_hash": pw_hash,
        "password_salt": salt,
        "created_at": now_iso,
        "updated_at": now_iso,
    }

    _USER_DATABASE[user_id] = user_record
    _USER_EMAIL_INDEX[clean_email] = user_id

    record_audit_event(
        actor_user_id=user_id,
        actor_role=ROLE_GOVERNMENT_OFFICIAL,
        action="OFFICIAL_REGISTRATION_REQUESTED",
        target_id=user_id,
        result="PENDING_APPROVAL",
        metadata={"department": department, "designation": designation},
    )

    return {
        "success": True,
        "user_id": user_id,
        "email": clean_email,
        "role": ROLE_GOVERNMENT_OFFICIAL,
        "status": STATUS_PENDING,
        "message": "Government Official registration submitted. Account is pending Admin approval.",
    }


def bootstrap_system_admin(
    email: str,
    password: str,
    name: str,
    admin_secret_key: str,
) -> Dict[str, Any]:
    """
    Provisions an initial SYSTEM_ADMIN account using the protected master admin secret key.
    Public registration without the secret key is strictly rejected.
    """
    global _USER_DATABASE, _USER_EMAIL_INDEX
    clean_email = str(email).strip().lower()

    if admin_secret_key != ADMIN_BOOTSTRAP_SECRET:
        return {"success": False, "error": "Invalid admin bootstrap secret key", "status_code": 403}
    if not clean_email or "@" not in clean_email:
        return {"success": False, "error": "Invalid admin email", "status_code": 400}
    if not password or len(password) < 8:
        return {"success": False, "error": "Admin password must be at least 8 characters", "status_code": 400}

    now_iso = datetime.now(timezone.utc).isoformat()
    salt = secrets.token_hex(16)
    pw_hash = _hash_password(password, salt)

    if clean_email in _USER_EMAIL_INDEX:
        user_id = _USER_EMAIL_INDEX[clean_email]
        user = _USER_DATABASE[user_id]
        user["role"] = ROLE_SYSTEM_ADMIN
        user["status"] = STATUS_ACTIVE
        user["password_hash"] = pw_hash
        user["password_salt"] = salt
        _USER_DATABASE[user_id] = user
    else:
        user_id = f"admin_{secrets.token_hex(8)}"
        user_record = {
            "user_id": user_id,
            "email": clean_email,
            "name": str(name).strip() or "System Admin",
            "role": ROLE_SYSTEM_ADMIN,
            "status": STATUS_ACTIVE,
            "auth_provider": "email_password",
            "password_hash": pw_hash,
            "password_salt": salt,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        _USER_DATABASE[user_id] = user_record
        _USER_EMAIL_INDEX[clean_email] = user_id

    record_audit_event(
        actor_user_id=user_id,
        actor_role=ROLE_SYSTEM_ADMIN,
        action="ADMIN_BOOTSTRAPPED",
        target_id=user_id,
        result="SUCCESS",
    )

    return {
        "success": True,
        "user_id": user_id,
        "email": clean_email,
        "role": ROLE_SYSTEM_ADMIN,
        "status": STATUS_ACTIVE,
        "message": "System Administrator account provisioned successfully",
    }


def admin_approve_official(
    admin_user_id: str,
    official_user_id: str,
) -> Dict[str, Any]:
    """
    Approves a PENDING Government Official account (SYSTEM_ADMIN only).
    """
    global _USER_DATABASE
    admin = _USER_DATABASE.get(admin_user_id)
    if not admin or admin.get("role") != ROLE_SYSTEM_ADMIN or admin.get("status") != STATUS_ACTIVE:
        return {"success": False, "error": "Unauthorized: System Admin privileges required", "status_code": 403}

    official = _USER_DATABASE.get(official_user_id)
    if not official:
        return {"success": False, "error": "Official account not found", "status_code": 404}
    if official.get("role") != ROLE_GOVERNMENT_OFFICIAL:
        return {"success": False, "error": "Target user is not a Government Official", "status_code": 400}

    official["status"] = STATUS_ACTIVE
    official["approved_by"] = admin_user_id
    official["approved_at"] = datetime.now(timezone.utc).isoformat()
    _USER_DATABASE[official_user_id] = official

    record_audit_event(
        actor_user_id=admin_user_id,
        actor_role=ROLE_SYSTEM_ADMIN,
        action="ADMIN_APPROVED_OFFICIAL",
        target_id=official_user_id,
        result="SUCCESS",
    )

    return {
        "success": True,
        "official_user_id": official_user_id,
        "status": STATUS_ACTIVE,
        "message": "Government Official approved successfully",
    }


def admin_suspend_official(
    admin_user_id: str,
    official_user_id: str,
    reason: str,
) -> Dict[str, Any]:
    """
    Suspends an active Government Official account and revokes active sessions (SYSTEM_ADMIN only).
    """
    global _USER_DATABASE, _ACTIVE_SESSIONS
    admin = _USER_DATABASE.get(admin_user_id)
    if not admin or admin.get("role") != ROLE_SYSTEM_ADMIN or admin.get("status") != STATUS_ACTIVE:
        return {"success": False, "error": "Unauthorized: System Admin privileges required", "status_code": 403}

    official = _USER_DATABASE.get(official_user_id)
    if not official:
        return {"success": False, "error": "Official account not found", "status_code": 404}

    official["status"] = STATUS_SUSPENDED
    official["suspended_by"] = admin_user_id
    official["suspended_at"] = datetime.now(timezone.utc).isoformat()
    official["suspension_reason"] = reason
    _USER_DATABASE[official_user_id] = official

    # Invalidate all active sessions for this official
    revoked_sessions = 0
    for token, sess in list(_ACTIVE_SESSIONS.items()):
        if sess.get("user_id") == official_user_id:
            del _ACTIVE_SESSIONS[token]
            revoked_sessions += 1

    record_audit_event(
        actor_user_id=admin_user_id,
        actor_role=ROLE_SYSTEM_ADMIN,
        action="ADMIN_SUSPENDED_OFFICIAL",
        target_id=official_user_id,
        result="SUCCESS",
        metadata={"reason": reason, "revoked_sessions": revoked_sessions},
    )

    return {
        "success": True,
        "official_user_id": official_user_id,
        "status": STATUS_SUSPENDED,
        "message": f"Government Official suspended. {revoked_sessions} sessions revoked.",
    }


# ==============================================================================
# SESSION MANAGEMENT & AUTHORIZATION MIDDLEWARE
# ==============================================================================

def _create_session(user: Dict[str, Any]) -> Dict[str, Any]:
    """Generates a secure server-side session token."""
    global _ACTIVE_SESSIONS
    token = f"sess_{secrets.token_hex(24)}"
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=SESSION_TTL_HOURS)

    session_record = {
        "token": token,
        "user_id": user["user_id"],
        "role": user["role"],
        "status": user["status"],
        "created_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
    }
    _ACTIVE_SESSIONS[token] = session_record
    return session_record


def login_user(email: str, password: str) -> Dict[str, Any]:
    """
    Authenticates a user via Email/Password credentials for CITIZEN, GOVERNMENT_OFFICIAL, or SYSTEM_ADMIN.
    """
    global _USER_DATABASE, _USER_EMAIL_INDEX
    clean_email = str(email).strip().lower()

    user_id = _USER_EMAIL_INDEX.get(clean_email)
    if not user_id:
        return {"success": False, "error": "Invalid email or password", "status_code": 401}

    user = _USER_DATABASE.get(user_id)
    if not user:
        return {"success": False, "error": "Invalid email or password", "status_code": 401}

    # Verify password hash
    stored_hash = user.get("password_hash")
    salt = user.get("password_salt")
    if not stored_hash or not salt or not _verify_password(password, stored_hash, salt):
        return {"success": False, "error": "Invalid email or password", "status_code": 401}

    # Check account status
    if user.get("status") == STATUS_SUSPENDED:
        record_audit_event(
            actor_user_id=user_id,
            actor_role=user["role"],
            action="LOGIN_REJECTED_SUSPENDED",
            target_id=user_id,
            result="DENIED",
        )
        return {"success": False, "error": "Account is suspended. Contact Administrator.", "status_code": 403}

    if user.get("status") == STATUS_PENDING:
        return {
            "success": False,
            "error": "Account is pending Administrator approval.",
            "status_code": 403,
        }

    # Issue session
    session = _create_session(user)
    action_name = f"{user['role']}_LOGIN" if user['role'] != ROLE_CITIZEN else "USER_LOGIN"
    record_audit_event(
        actor_user_id=user_id,
        actor_role=user["role"],
        action=action_name,
        target_id=user_id,
        result="SUCCESS",
    )

    return {
        "success": True,
        "session_token": session["token"],
        "user": _sanitize_user_profile(user),
    }


def logout_user(session_token: str) -> Dict[str, Any]:
    """Invalidates an active session token."""
    global _ACTIVE_SESSIONS
    sess = _ACTIVE_SESSIONS.pop(session_token, None)
    if sess:
        record_audit_event(
            actor_user_id=sess["user_id"],
            actor_role=sess["role"],
            action="USER_LOGOUT",
            target_id=sess["user_id"],
            result="SUCCESS",
        )
    return {"success": True, "message": "Logged out successfully"}


def verify_session(session_token: Optional[str]) -> Optional[Dict[str, Any]]:
    """
    Verifies session token validity and expiration.
    Returns user record if valid, None otherwise.
    """
    if not session_token:
        return None

    sess = _ACTIVE_SESSIONS.get(session_token)
    if not sess:
        return None

    # Check expiration
    expires_at = datetime.fromisoformat(sess["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        _ACTIVE_SESSIONS.pop(session_token, None)
        return None

    user = _USER_DATABASE.get(sess["user_id"])
    if not user or user.get("status") != STATUS_ACTIVE:
        return None

    return user


def require_permission(
    session_token: Optional[str],
    allowed_roles: List[str],
    required_status: str = STATUS_ACTIVE,
) -> Dict[str, Any]:
    """
    Server-side authorization guard verifying session, roles, and account status.
    """
    if not session_token:
        return {"authorized": False, "error": "Authentication required. Missing session token.", "status_code": 401}

    user = verify_session(session_token)
    if not user:
        return {"authorized": False, "error": "Invalid or expired session.", "status_code": 401}

    if user.get("status") != required_status:
        return {
            "authorized": False,
            "error": f"Account status '{user.get('status')}' is not authorized.",
            "status_code": 403,
        }

    if user.get("role") not in allowed_roles:
        return {
            "authorized": False,
            "error": f"Access denied. Requires one of roles: {allowed_roles}. Current role: {user.get('role')}.",
            "status_code": 403,
        }

    return {"authorized": True, "user": user}


def _sanitize_user_profile(user: Dict[str, Any]) -> Dict[str, Any]:
    """Returns a sanitized user profile excluding password hashes and private salts."""
    return {
        "user_id": user.get("user_id"),
        "email": user.get("email"),
        "name": user.get("name"),
        "phone_number": user.get("phone_number"),
        "role": user.get("role"),
        "status": user.get("status"),
        "department": user.get("department"),
        "designation": user.get("designation"),
        "created_at": user.get("created_at"),
    }


def get_user_profile(user_id_or_session_token: str) -> Optional[Dict[str, Any]]:
    """Retrieves sanitized user profile by user_id or session_token."""
    user = verify_session(user_id_or_session_token)
    if user:
        return _sanitize_user_profile(user)

    user = _USER_DATABASE.get(user_id_or_session_token)
    if user:
        return _sanitize_user_profile(user)
    return None


# ==============================================================================
# OFFICIAL FIELD UPDATES & MITIGATION OVERRIDES
# ==============================================================================

def submit_official_field_update(
    official_user_id_or_token: str,
    ward_id: str,
    hazard_type: str,
    official_status: str,
    reason: str,
    valid_hours: int = OFFICIAL_OVERRIDE_DEFAULT_HOURS,
    evidence_ref: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Submits an official field mitigation update (GOVERNMENT_OFFICIAL only).

    CRITICAL ARCHITECTURAL CONSTRAINTS:
    - Does NOT modify or overwrite risk_engine.py formulas or analytical scores.
    - Stored in a separate operational mitigation layer.
    - Expires automatically after valid_hours (default 6 hours).
    - Allowed statuses: CONFIRMED, PARTIALLY_MITIGATED, FULLY_MITIGATED, RESOLVED, INCORRECT_REPORT, DISPUTED.
    """
    global _OFFICIAL_FIELD_UPDATES
    # Verify official
    user = verify_session(official_user_id_or_token) or _USER_DATABASE.get(official_user_id_or_token)
    if not user or user.get("role") != ROLE_GOVERNMENT_OFFICIAL or user.get("status") != STATUS_ACTIVE:
        return {"success": False, "error": "Unauthorized: Active Government Official privileges required", "status_code": 403}

    status_clean = str(official_status).upper().strip()
    if status_clean not in ALLOWED_OFFICIAL_STATUSES:
        return {
            "success": False,
            "error": f"Invalid official status '{status_clean}'. Must be one of: {list(ALLOWED_OFFICIAL_STATUSES)}",
            "status_code": 400,
        }

    now = datetime.now(timezone.utc)
    valid_until = now + timedelta(hours=max(1, int(valid_hours)))
    update_id = f"off_upd_{ward_id}_{hazard_type}_{secrets.token_hex(4)}"

    update_record = {
        "update_id": update_id,
        "official_user_id": user["user_id"],
        "official_name": user.get("name", "Government Official"),
        "ward_id": ward_id,
        "hazard_type": hazard_type,
        "official_status": status_clean,
        "reason": str(reason).strip(),
        "evidence_ref": evidence_ref,
        "verification_status": VERIF_OFFICIAL_REPORTED,
        "verified_by": None,
        "verified_at": None,
        "created_at": now.isoformat(),
        "valid_until": valid_until.isoformat(),
        "is_active": True,
    }

    _OFFICIAL_FIELD_UPDATES[update_id] = update_record

    record_audit_event(
        actor_user_id=user["user_id"],
        actor_role=ROLE_GOVERNMENT_OFFICIAL,
        action="OFFICIAL_SUBMITTED_FIELD_UPDATE",
        target_id=update_id,
        result="SUCCESS",
        metadata={
            "ward_id": ward_id,
            "hazard_type": hazard_type,
            "official_status": status_clean,
            "valid_hours": valid_hours,
        },
    )

    return {
        "success": True,
        "update_id": update_id,
        "ward_id": ward_id,
        "hazard_type": hazard_type,
        "official_status": status_clean,
        "valid_until": valid_until.isoformat(),
        "message": f"Official field update registered. Active for {valid_hours} hours.",
    }


def verify_official_field_update(
    second_official_user_id_or_token: str,
    update_id: str,
    verification_status: str,
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Allows a 2nd active Government Official to verify or dispute an official field update.
    """
    global _OFFICIAL_FIELD_UPDATES
    user = verify_session(second_official_user_id_or_token) or _USER_DATABASE.get(second_official_user_id_or_token)
    if not user or user.get("role") != ROLE_GOVERNMENT_OFFICIAL or user.get("status") != STATUS_ACTIVE:
        return {"success": False, "error": "Unauthorized: Active Government Official privileges required", "status_code": 403}

    update = _OFFICIAL_FIELD_UPDATES.get(update_id)
    if not update:
        return {"success": False, "error": "Official field update not found", "status_code": 404}

    verif_clean = str(verification_status).upper().strip()
    if verif_clean not in (VERIF_OFFICIALLY_VERIFIED, VERIF_DISPUTED):
        return {"success": False, "error": f"Invalid status. Must be {VERIF_OFFICIALLY_VERIFIED} or {VERIF_DISPUTED}", "status_code": 400}

    now_iso = datetime.now(timezone.utc).isoformat()
    update["verification_status"] = verif_clean
    update["verified_by"] = user["user_id"]
    update["verified_at"] = now_iso
    if notes:
        update["verification_notes"] = str(notes)

    record_audit_event(
        actor_user_id=user["user_id"],
        actor_role=ROLE_GOVERNMENT_OFFICIAL,
        action="OFFICIAL_VERIFIED_FIELD_UPDATE",
        target_id=update_id,
        result="SUCCESS",
        metadata={"verification_status": verif_clean},
    )

    return {
        "success": True,
        "update_id": update_id,
        "verification_status": verif_clean,
        "verified_by": user["user_id"],
        "message": f"Official update marked as {verif_clean}",
    }


def get_active_field_updates(
    ward_id: Optional[str] = None,
    hazard_type: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieves active (non-expired) official field updates.
    """
    now = datetime.now(timezone.utc)
    active_updates = []

    for upd in _OFFICIAL_FIELD_UPDATES.values():
        if not upd.get("is_active", True):
            continue
        valid_until = datetime.fromisoformat(upd["valid_until"])
        if now > valid_until:
            # Expired
            continue
        if ward_id and upd.get("ward_id") != ward_id:
            continue
        if hazard_type and upd.get("hazard_type") != hazard_type:
            continue
        active_updates.append(upd)

    return active_updates


def get_ward_status_with_mitigation(
    ward_id: str,
    hazard_type: str,
) -> Dict[str, Any]:
    """
    Produces composite multi-source status for a ward:
    1. Analytical Risk Engine calculation (unmodified)
    2. Active Government Official Field Update (if any)
    3. Citizen Crowd Reports (if any)
    4. Conflict Detection flag (if official says MITIGATED but citizens report hazard present)
    """
    # 1. Baseline analytical scoring from risk_engine
    static_baseline = risk_engine.WARD_DATA.get(ward_id, {})
    ward_name = static_baseline.get("name", ward_id.replace("_", " ").title())

    # 2. Check active official field updates
    active_updates = get_active_field_updates(ward_id=ward_id, hazard_type=hazard_type)
    official_update = active_updates[-1] if active_updates else None
    official_status = official_update.get("official_status") if official_update else "NO_OFFICIAL_UPDATE"

    # 3. Check active crowd updates
    crowd_reports = crowd_updates.get_crowd_updates(ward_id=ward_id)
    ward_reports = [r for r in crowd_reports if r.get("update_type") in (hazard_type, "flooding", "waterlogging", "heavy_rain")]
    has_citizen_active_hazard = any(r.get("answer") == "YES" for r in ward_reports)

    # 4. Conflict Detection
    is_conflict = False
    if official_status in (OFFICIAL_FULLY_MITIGATED, OFFICIAL_RESOLVED, OFFICIAL_PARTIALLY_MITIGATED) and has_citizen_active_hazard:
        is_conflict = True

    return {
        "ward_id": ward_id,
        "ward_name": ward_name,
        "hazard_type": hazard_type,
        "analytical_risk": {
            "source": "risk_engine",
            "ward_baseline_available": bool(static_baseline),
        },
        "official_mitigation": {
            "has_active_update": bool(official_update),
            "official_status": official_status,
            "details": official_update,
        },
        "citizen_crowd": {
            "reports_count": len(ward_reports),
            "has_active_citizen_hazard": has_citizen_active_hazard,
        },
        "conflict_detected": is_conflict,
        "conflict_status": "CONFLICTING_REPORTS" if is_conflict else "ALIGNED",
    }


# ==============================================================================
# GOVERNMENT CAMP MANAGEMENT (REUSING emergency_locations.py)
# ==============================================================================

def create_government_camp(
    official_user_id_or_token: str,
    name: str,
    latitude: float,
    longitude: float,
    address: str,
    capacity: int,
    ward_id: str,
    hazard_type: str = "all",
    contact_information: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Creates a temporary government relief camp (GOVERNMENT_OFFICIAL only).
    Reuses existing emergency_locations.py logic.
    """
    user = verify_session(official_user_id_or_token) or _USER_DATABASE.get(official_user_id_or_token)
    if not user or user.get("role") != ROLE_GOVERNMENT_OFFICIAL or user.get("status") != STATUS_ACTIVE:
        return {"success": False, "error": "Unauthorized: Active Government Official privileges required", "status_code": 403}

    if not name or len(str(name).strip()) < 3:
        return {"success": False, "error": "Camp name must be at least 3 characters", "status_code": 400}
    if capacity <= 0:
        return {"success": False, "error": "Capacity must be greater than zero", "status_code": 400}

    # Validate coordinates inside Bhubaneswar region (approx 20.00 to 20.60, 85.50 to 86.10)
    if not (20.0 <= latitude <= 20.6 and 85.5 <= longitude <= 86.1):
        return {"success": False, "error": "Coordinates outside valid Bhubaneswar municipal boundary", "status_code": 400}

    # Create camp via emergency_locations module
    camp_result = el.create_government_emergency_camp(
        name=name,
        latitude=latitude,
        longitude=longitude,
        address=address,
        capacity=int(capacity),
        available_capacity=int(capacity),
        ward_id=ward_id,
        hazard_type=hazard_type,
        created_by=user["user_id"],
    )

    camp_id = camp_result.get("id") or camp_result.get("$id")
    record_audit_event(
        actor_user_id=user["user_id"],
        actor_role=ROLE_GOVERNMENT_OFFICIAL,
        action="OFFICIAL_CREATED_CAMP",
        target_id=camp_id,
        result="SUCCESS",
        metadata={"name": name, "capacity": capacity, "ward_id": ward_id},
    )

    return {
        "success": True,
        "camp": camp_result,
        "camp_id": camp_id,
        "message": "Government relief camp created and verified successfully",
    }


def update_government_camp(
    official_user_id_or_token: str,
    camp_id: str,
    occupied_capacity: Optional[int] = None,
    total_capacity: Optional[int] = None,
    status: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Updates camp capacity or status (GOVERNMENT_OFFICIAL only).
    Enforces occupied_capacity <= capacity validation.
    """
    user = verify_session(official_user_id_or_token) or _USER_DATABASE.get(official_user_id_or_token)
    if not user or user.get("role") != ROLE_GOVERNMENT_OFFICIAL or user.get("status") != STATUS_ACTIVE:
        return {"success": False, "error": "Unauthorized: Active Government Official privileges required", "status_code": 403}

    # If capacity is updated, validate occupied <= total
    if occupied_capacity is not None and total_capacity is not None:
        if occupied_capacity > total_capacity:
            return {"success": False, "error": "Occupied capacity cannot exceed total capacity", "status_code": 400}

    # Map status
    mapped_status = None
    if status:
        s_upper = str(status).upper().strip()
        if s_upper in ("OPEN", "ACTIVE"):
            mapped_status = "ACTIVE"
        elif s_upper == "FULL":
            mapped_status = "FULL"
        elif s_upper == "CLOSED":
            mapped_status = "CLOSED"
        else:
            return {"success": False, "error": f"Invalid status '{status}'. Must be OPEN, FULL, or CLOSED", "status_code": 400}

    # Update via emergency_locations module
    if occupied_capacity is not None:
        total_cap = total_capacity or 250
        avail_cap = max(0, total_cap - occupied_capacity)
        res = el.update_camp_capacity(location_id=camp_id, capacity=total_cap, available_capacity=avail_cap)
    elif mapped_status is not None:
        res = el.update_camp_status(location_id=camp_id, status=mapped_status)
    else:
        res = {"success": True, "message": "No changes requested"}

    action_name = "OFFICIAL_CLOSED_CAMP" if mapped_status == "CLOSED" else "OFFICIAL_UPDATED_CAMP"
    record_audit_event(
        actor_user_id=user["user_id"],
        actor_role=ROLE_GOVERNMENT_OFFICIAL,
        action=action_name,
        target_id=camp_id,
        result="SUCCESS",
        metadata={"occupied_capacity": occupied_capacity, "status": mapped_status},
    )

    return {"success": True, "camp": res, "message": "Camp updated successfully"}


# ==============================================================================
# STATE RESET UTILITIES (FOR TESTING)
# ==============================================================================

def reset_auth_state() -> None:
    """Resets all in-memory auth databases, sessions, field updates, and audit logs."""
    global _USER_DATABASE, _USER_EMAIL_INDEX, _ACTIVE_SESSIONS, _OFFICIAL_FIELD_UPDATES, _AUDIT_LOGS
    _USER_DATABASE.clear()
    _USER_EMAIL_INDEX.clear()
    _ACTIVE_SESSIONS.clear()
    _OFFICIAL_FIELD_UPDATES.clear()
    _AUDIT_LOGS.clear()
