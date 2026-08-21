"""
Apada Sathi - Location-Aware Multi-Hazard Notification Engine
=============================================================

Coordinates end-to-end location-aware disaster notifications:
1. Exact Core Notification Rules:
   - LOW: No push, no SMS (map display only)
   - MODERATE: No push, no SMS (structured in-app alert data only)
   - HIGH: Location-aware Push + SMS (if enabled)
   - EMERGENCY: Location-aware Push + SMS (if enabled)
2. Geofence & Proximity Detection (INSIDE, NEAR, OUTSIDE active hazard circles)
3. Fixed Deterministic Templates (strictly NO AI / Gemini generation)
4. Intelligent Deduplication & Configurable Cooldown Engine
5. Safe-Place Deep-Link Integration (reusing emergency_locations.py)
6. Provider-Independent Dispatching (via notification_provider.py & sms_service.py)
7. Strict Location & Credential Privacy Protection

CRITICAL ARCHITECTURAL CONSTRAINTS:
- risk_engine.py is the HEART of the system and is NEVER modified.
- Risk scores, severity bands, and confidence formulas are 100% untouched.
- Completely provider-independent and fully testable in offline mock mode.
"""

from datetime import datetime, timezone, timedelta
import os
from typing import Any, Dict, List, Optional, Set, Tuple, Union
from dotenv import load_dotenv

import risk_engine
import map_zones
import emergency_locations as el
from notification_provider import ProviderFactory, BaseNotificationProvider
import sms_service

load_dotenv()

# ==============================================================================
# CONFIGURATION & CONSTANTS
# ==============================================================================

DEFAULT_NOTIFICATION_COOLDOWN_MINUTES = int(os.environ.get("NOTIFICATION_COOLDOWN_MINUTES", "30"))
NEAR_ZONE_MULTIPLIER = 1.5  # Proximity buffer for 'NEAR' zone classification

# Notification decision rules mapped directly from severity tiers
NOTIFICATION_RULES = {
    "LOW": {"push": False, "sms": False, "in_app": False, "map": True},
    "MODERATE": {"push": False, "sms": False, "in_app": True, "map": True},
    "HIGH": {"push": True, "sms": True, "in_app": True, "map": True},
    "EMERGENCY": {"push": True, "sms": True, "in_app": True, "map": True},
}

# ==============================================================================
# IN-MEMORY USER / DEVICE REGISTRY & DEDUPLICATION CACHE
# ==============================================================================

# User / Device registry
_USER_REGISTRY: Dict[str, Dict[str, Any]] = {}

# Notification history tracking: (user_or_device_id, ward_id, hazard_type) -> history dict
_NOTIFICATION_HISTORY: Dict[Tuple[str, str, str], Dict[str, Any]] = {}


# ==============================================================================
# DETERMINISTIC FIXED MESSAGE TEMPLATES (STRICTLY NO AI GENERATION)
# ==============================================================================

# Deterministic titles and message templates for all 5 hazards
HAZARD_DISPLAY_NAMES = {
    "heavy_rainfall": "Heavy Rainfall",
    "flood": "Flood",
    "waterlogging": "Waterlogging",
    "lightning": "Lightning",
    "cyclone": "Cyclone",
}

def generate_notification_title(hazard_type: str, severity: str) -> str:
    """
    Generates standardized deterministic notification titles.
    Examples: '⚠️ HIGH FLOOD ALERT', '🔴 EMERGENCY CYCLONE ALERT'
    """
    h_name = HAZARD_DISPLAY_NAMES.get(hazard_type, hazard_type.replace("_", " ").title()).upper()
    sev_upper = str(severity).upper().strip()

    if sev_upper == "EMERGENCY":
        return f"🔴 EMERGENCY {h_name} ALERT"
    elif sev_upper == "HIGH":
        return f"⚠️ HIGH {h_name} ALERT"
    elif sev_upper == "MODERATE":
        return f"⚡ MODERATE {h_name} ADVISORY"
    else:
        return f"ℹ️ {h_name} UPDATE"


def generate_notification_body(locality_or_ward: str, hazard_type: str, severity: str) -> str:
    """
    Generates standardized deterministic notification body text directing users
    toward the existing 'Safe Places Near Me' system.
    """
    loc_clean = locality_or_ward or "Bhubaneswar"
    h_name = HAZARD_DISPLAY_NAMES.get(hazard_type, hazard_type.replace("_", " ").title()).lower()
    sev_upper = str(severity).upper().strip()

    if sev_upper == "EMERGENCY":
        return (
            f"{loc_clean} is currently affected by a {h_name} emergency. "
            f"Please move away from the affected area and proceed to the nearest available safe place. "
            f"Open Apada Sathi to find a safe place near you."
        )
    elif sev_upper == "HIGH":
        return (
            f"{loc_clean} is currently affected by a high {h_name} risk. "
            f"Please avoid the affected area and move to the nearest available safe place. "
            f"Open Apada Sathi to find a safe place near you."
        )
    elif sev_upper == "MODERATE":
        return (
            f"{loc_clean} has moderate {h_name} conditions. "
            f"Stay alert and monitor local updates in Apada Sathi."
        )
    else:
        return f"Conditions in {loc_clean} are currently low risk for {h_name}."


# ==============================================================================
# LOCATION EVALUATION & GEOFENCING
# ==============================================================================

def evaluate_geofence_status(
    user_lat: float,
    user_lon: float,
    zone_lat: float,
    zone_lon: float,
    affected_radius_km: float,
) -> Tuple[str, float]:
    """
    Evaluates spatial relationship between user and a hazard zone circle.

    States:
    - 'INSIDE': distance <= affected_radius_km
    - 'NEAR': affected_radius_km < distance <= affected_radius_km * NEAR_ZONE_MULTIPLIER
    - 'OUTSIDE': distance > affected_radius_km * NEAR_ZONE_MULTIPLIER

    Returns:
        (geofence_status: str, distance_km: float)
    """
    dist_km = el.haversine_distance(user_lat, user_lon, zone_lat, zone_lon)

    if dist_km <= affected_radius_km:
        return "INSIDE", dist_km
    elif dist_km <= (affected_radius_km * NEAR_ZONE_MULTIPLIER):
        return "NEAR", dist_km
    else:
        return "OUTSIDE", dist_km


# ==============================================================================
# DEDUPLICATION & COOLDOWN MANAGER
# ==============================================================================

def should_send_notification(
    recipient_id: str,
    ward_id: str,
    hazard_type: str,
    severity: str,
    cooldown_minutes: Optional[int] = None,
) -> Tuple[bool, str]:
    """
    Deduplication logic to prevent spamming users inside an active hazard zone.

    Rules:
    1. First notification in a zone -> ALLOW
    2. Entering a different zone -> ALLOW
    3. Severity escalation (e.g. HIGH -> EMERGENCY) -> ALLOW
    4. Cooldown expired (default 30 mins) -> ALLOW
    5. Same zone, same or lower severity, within cooldown -> REJECT (suppress duplicate)

    Returns:
        (should_send: bool, reason: str)
    """
    global _NOTIFICATION_HISTORY
    key = (str(recipient_id), str(ward_id), str(hazard_type))
    record = _NOTIFICATION_HISTORY.get(key)

    if not record:
        return True, "Initial notification for this zone"

    last_sev = record.get("severity", "LOW")
    last_time = record.get("notified_at")
    last_rank = risk_engine.SEVERITY_RANK.get(last_sev, 0)
    current_rank = risk_engine.SEVERITY_RANK.get(severity, 0)

    # 1. Severity escalation check
    if current_rank > last_rank:
        return True, f"Severity escalated from {last_sev} to {severity}"

    # 2. Cooldown check
    c_mins = cooldown_minutes if cooldown_minutes is not None else DEFAULT_NOTIFICATION_COOLDOWN_MINUTES
    cooldown_delta = timedelta(minutes=c_mins)
    now = datetime.now(timezone.utc)

    if last_time and (now - last_time) >= cooldown_delta:
        return True, f"Cooldown of {c_mins} minutes elapsed"

    remaining_mins = int((cooldown_delta - (now - last_time)).total_seconds() / 60)
    return False, f"Duplicate notification suppressed (cooldown active: {remaining_mins} min remaining)"


def record_notification_sent(
    recipient_id: str,
    ward_id: str,
    hazard_type: str,
    severity: str,
) -> None:
    """Updates the deduplication tracker with the latest notification event."""
    global _NOTIFICATION_HISTORY
    key = (str(recipient_id), str(ward_id), str(hazard_type))
    _NOTIFICATION_HISTORY[key] = {
        "severity": severity,
        "notified_at": datetime.now(timezone.utc),
    }


def reset_notification_history() -> None:
    """Clears notification deduplication history for testing."""
    global _NOTIFICATION_HISTORY
    _NOTIFICATION_HISTORY.clear()


# ==============================================================================
# USER / DEVICE REGISTRATION & PRIVACY MANAGEMENT
# ==============================================================================

def register_user_device(
    user_id: str,
    device_id: str,
    fcm_token: Optional[str] = None,
    phone_number: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    notification_enabled: bool = True,
    sms_enabled: bool = True,
    sms_opt_out: bool = False,
) -> Dict[str, Any]:
    """
    Registers or updates a user device record with complete privacy.
    Coordinates, phone numbers, and sensitive tokens are never exposed in public responses.
    """
    global _USER_REGISTRY
    now_iso = datetime.now(timezone.utc).isoformat()
    reg_id = str(user_id or device_id)

    record = {
        "user_id": user_id,
        "device_id": device_id,
        "fcm_token": fcm_token,
        "phone_number": phone_number,
        "latitude": latitude,
        "longitude": longitude,
        "notification_enabled": bool(notification_enabled),
        "sms_enabled": bool(sms_enabled) and not bool(sms_opt_out),
        "sms_opt_out": bool(sms_opt_out) or not bool(sms_enabled),
        "location_updated_at": now_iso if (latitude is not None and longitude is not None) else None,
        "updated_at": now_iso,
        "created_at": _USER_REGISTRY.get(reg_id, {}).get("created_at", now_iso),
    }

    _USER_REGISTRY[reg_id] = record
    return {
        "status": "REGISTERED",
        "user_id": user_id,
        "device_id": device_id,
        "notification_enabled": record["notification_enabled"],
        "sms_enabled": record["sms_enabled"],
        "sms_opt_out": record["sms_opt_out"],
        "has_fcm_token": bool(fcm_token),
        "has_phone_number": bool(phone_number),
        "updated_at": now_iso,
    }


def update_user_location(
    user_id_or_device_id: str,
    latitude: float,
    longitude: float,
) -> Dict[str, Any]:
    """Updates user coordinates safely."""
    global _USER_REGISTRY
    reg_id = str(user_id_or_device_id)
    now_iso = datetime.now(timezone.utc).isoformat()

    if reg_id not in _USER_REGISTRY:
        register_user_device(
            user_id=reg_id,
            device_id=reg_id,
            latitude=latitude,
            longitude=longitude,
        )
    else:
        _USER_REGISTRY[reg_id]["latitude"] = latitude
        _USER_REGISTRY[reg_id]["longitude"] = longitude
        _USER_REGISTRY[reg_id]["location_updated_at"] = now_iso
        _USER_REGISTRY[reg_id]["updated_at"] = now_iso

    return {"status": "LOCATION_UPDATED", "updated_at": now_iso}


def get_user_record(user_id_or_device_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves user device record internally."""
    return _USER_REGISTRY.get(str(user_id_or_device_id))


def reset_user_registry() -> None:
    """Clears in-memory user registry for testing."""
    global _USER_REGISTRY
    _USER_REGISTRY.clear()


# ==============================================================================
# CORE NOTIFICATION DISPATCH ENGINE
# ==============================================================================

def process_user_location_alert(
    user_id_or_device_id: str,
    latitude: float,
    longitude: float,
    fcm_token: Optional[str] = None,
    phone_number: Optional[str] = None,
    hazard_filter: Optional[str] = None,
    precomputed_zones: Optional[List[Dict[str, Any]]] = None,
    push_provider: Optional[BaseNotificationProvider] = None,
    sms_provider: Optional[BaseNotificationProvider] = None,
    force_notify: bool = False,
    sms_opt_out: Optional[bool] = None,
) -> Dict[str, Any]:
    """
    Main entry point for evaluating user location against active hazard zones
    and dispatching multi-channel notifications (Push / SMS / In-App).

    Workflow:
    1. Retrieves active map zones from map_zones.py.
    2. Identifies the nearest active hazard zone and calculates geofence state.
    3. Evaluates core notification rules based on existing risk engine severity:
       - LOW: Returns no alert.
       - MODERATE: Generates structured in-app alert (no push, no SMS).
       - HIGH / EMERGENCY: If INSIDE (or approaching NEAR), checks deduplication & cooldown.
    4. Automatically queries verified Safe Places via emergency_locations.py.
    5. Dispatches Push Notification (FCM / Provider).
    6. Dispatches SMS Notification (MSG91 / Generic / Provider if configured).
    7. Updates deduplication history.

    Returns:
        Structured notification execution summary.
    """
    # 1. Acquire map zones
    if precomputed_zones is not None:
        zones = precomputed_zones
    else:
        zones = map_zones.get_map_zones(hazard_filter=hazard_filter or "all")

    if not zones:
        return {
            "status": "NO_ZONES",
            "notified": False,
            "action": "NONE",
            "message": "No active hazard zones found.",
        }

    # 2. Find closest hazard zone to user
    evaluated_zones = []
    for z in zones:
        z_lat = z.get("latitude")
        z_lon = z.get("longitude")
        z_radius = z.get("affected_radius_km", 1.5)
        if z_lat is None or z_lon is None:
            continue

        geo_status, dist_km = evaluate_geofence_status(
            user_lat=latitude,
            user_lon=longitude,
            zone_lat=z_lat,
            zone_lon=z_lon,
            affected_radius_km=z_radius,
        )
        evaluated_zones.append({
            "zone": z,
            "geofence_status": geo_status,
            "distance_km": dist_km,
        })

    # Prioritize zones where user is INSIDE, then NEAR, sorted by risk score
    def zone_priority(item: Dict[str, Any]) -> Tuple[int, float]:
        status_rank = 0 if item["geofence_status"] == "INSIDE" else (1 if item["geofence_status"] == "NEAR" else 2)
        score = item["zone"].get("risk_score", 0)
        return (status_rank, -score)

    evaluated_zones.sort(key=zone_priority)
    top_match = evaluated_zones[0]
    target_zone = top_match["zone"]
    geofence_status = top_match["geofence_status"]
    distance_km = top_match["distance_km"]

    severity = target_zone.get("severity", "LOW").upper()
    hazard_type = target_zone.get("hazard_type", "heavy_rainfall")
    ward_id = target_zone.get("ward_id", "ward_1")
    ward_name = target_zone.get("ward_name", ward_id.replace("_", " ").title())
    risk_score = target_zone.get("risk_score", 0.0)
    confidence = target_zone.get("confidence", 80.0)

    # --------------------------------------------------------------------------
    # RULE: LOW SEVERITY -> No push, no SMS
    # --------------------------------------------------------------------------
    if severity == "LOW":
        return {
            "status": "LOW_SEVERITY",
            "notified": False,
            "action": "NONE",
            "severity": "LOW",
            "ward_id": ward_id,
            "message": "User is in a LOW risk area. No notifications generated.",
        }

    # --------------------------------------------------------------------------
    # RULE: MODERATE SEVERITY -> In-App alert only (no push, no SMS)
    # --------------------------------------------------------------------------
    if severity == "MODERATE":
        in_app_title = generate_notification_title(hazard_type, "MODERATE")
        in_app_body = generate_notification_body(ward_name, hazard_type, "MODERATE")
        return {
            "status": "MODERATE_ADVISORY",
            "notified": False,
            "action": "IN_APP_ONLY",
            "severity": "MODERATE",
            "ward_id": ward_id,
            "hazard_type": hazard_type,
            "in_app_alert": {
                "title": in_app_title,
                "message": in_app_body,
                "ward_id": ward_id,
                "locality": ward_name,
                "hazard_type": hazard_type,
                "severity": "MODERATE",
                "risk_score": risk_score,
                "confidence": confidence,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        }

    # --------------------------------------------------------------------------
    # RULE: HIGH / EMERGENCY SEVERITY -> Geofence & Location-Aware Alert
    # --------------------------------------------------------------------------
    # User must be INSIDE (or approaching NEAR) the hazard circle
    if geofence_status == "OUTSIDE" and not force_notify:
        return {
            "status": "OUTSIDE_ZONE",
            "notified": False,
            "action": "NONE",
            "severity": severity,
            "distance_km": distance_km,
            "affected_radius_km": target_zone.get("affected_radius_km"),
            "message": f"User is outside the active {severity} hazard zone ({distance_km:.2f} km away).",
        }

    # Deduplication & Cooldown check
    should_send, dedup_reason = should_send_notification(
        recipient_id=user_id_or_device_id,
        ward_id=ward_id,
        hazard_type=hazard_type,
        severity=severity,
    )

    if not should_send and not force_notify:
        return {
            "status": "SUPPRESSED_DUPLICATE",
            "notified": False,
            "action": "SUPPRESSED",
            "reason": dedup_reason,
            "ward_id": ward_id,
            "severity": severity,
        }

    # 3. Formulate fixed deterministic messages (NO AI)
    alert_title = generate_notification_title(hazard_type, severity)
    alert_body = generate_notification_body(ward_name, hazard_type, severity)

    # 4. Query verified Safe Places (excluding active hazard zones & closed/full facilities)
    safe_places = []
    try:
        affected_set = {ward_id}
        safe_places = el.find_safe_emergency_locations(
            user_lat=latitude,
            user_lon=longitude,
            hazard_type=hazard_type,
            affected_zones=affected_set,
            max_results=3,
        )
    except Exception as e:
        print(f"Note on safe places query during notification: {e}")

    # 5. Deep-Link Payload
    deep_link_data = {
        "zone_id": f"{ward_id}_{hazard_type}",
        "ward_id": ward_id,
        "hazard_type": hazard_type,
        "severity": severity,
        "risk_score": str(risk_score),
        "target_screen": "hazard_details",
        "show_safe_places": "true",
    }

    # 6. Dispatch Push Notification (FCM / Provider)
    push_result = None
    active_push_provider = push_provider or ProviderFactory.get_push_provider()

    # Determine recipient FCM token
    token = fcm_token or _USER_REGISTRY.get(str(user_id_or_device_id), {}).get("fcm_token")
    target_token = token if token else f"device_{user_id_or_device_id}"

    try:
        push_result = active_push_provider.send_push(
            recipient_token=target_token,
            title=alert_title,
            body=alert_body,
            data=deep_link_data,
        )
    except Exception as e:
        print(f"Note: Push delivery error in notification_service (safe catch): {type(e).__name__}")
        push_result = {
            "success": False,
            "provider": getattr(active_push_provider, "name", "PushProvider"),
            "error": "Push delivery failed safely",
            "status": "FAILED",
        }

    # 7. Dispatch SMS Notification (if phone number provided & SMS configured)
    sms_result = None
    user_rec = _USER_REGISTRY.get(str(user_id_or_device_id), {})
    recipient_phone = phone_number or user_rec.get("phone_number")
    user_opt_out = (
        sms_opt_out if sms_opt_out is not None else user_rec.get("sms_opt_out", not user_rec.get("sms_enabled", True))
    )

    if recipient_phone:
        sms_result = sms_service.send_alert_sms(
            phone_number=recipient_phone,
            message=f"{alert_title}: {alert_body}",
            ward_name=ward_name,
            hazard_type=hazard_type,
            severity=severity,
            custom_provider=sms_provider,
            opt_out=user_opt_out,
        )

    # 8. Record notification in deduplication history
    record_notification_sent(
        recipient_id=user_id_or_device_id,
        ward_id=ward_id,
        hazard_type=hazard_type,
        severity=severity,
    )

    return {
        "status": "DISPATCHED",
        "notified": True,
        "action": "PUSH_AND_SMS" if sms_result and sms_result.get("success") else "PUSH",
        "severity": severity,
        "hazard_type": hazard_type,
        "ward_id": ward_id,
        "ward_name": ward_name,
        "geofence_status": geofence_status,
        "distance_km": round(distance_km, 2),
        "notification": {
            "title": alert_title,
            "body": alert_body,
            "deep_link": deep_link_data,
        },
        "safe_places_attached": len(safe_places),
        "safe_places": safe_places,
        "push_delivery": push_result,
        "sms_delivery": sms_result,
    }
