"""
Apada Sathi - SMS Channel Coordinator & Safety Service
======================================================

Coordinates SMS delivery across providers with safety controls:
1. Daily safety limits (SMS_DAILY_LIMIT)
2. Per-recipient cooldown enforcement (SMS_COOLDOWN_MINUTES)
3. SMS opt-out preference enforcement
4. Provider-independent dispatch via ProviderFactory (Twilio primary)
5. Graceful fallback when SMS is disabled or in mock mode

CRITICAL ARCHITECTURAL CONSTRAINTS:
- Does NOT alter risk_engine.py formulas or severity rules.
- Does NOT print or log complete mobile phone numbers or credentials.
"""

from datetime import datetime, timezone, timedelta
import os
from typing import Any, Dict, Optional, Tuple
from dotenv import load_dotenv

from notification_provider import ProviderFactory, BaseNotificationProvider, TwilioProvider

load_dotenv()

# ==============================================================================
# CONFIGURATION & CONSTANTS
# ==============================================================================

def get_sms_enabled() -> bool:
    return os.environ.get("TWILIO_ENABLED", os.environ.get("SMS_ENABLED", "false")).lower() == "true"

def get_daily_limit() -> int:
    try:
        return int(os.environ.get("SMS_DAILY_LIMIT", "50"))
    except ValueError:
        return 50

def get_cooldown_minutes() -> int:
    try:
        return int(os.environ.get("SMS_COOLDOWN_MINUTES", "30"))
    except ValueError:
        return 30

# In-memory rate limiting tracker
_SMS_TRACKER: Dict[str, Any] = {
    "dispatches_today": 0,
    "current_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    "recipient_cooldowns": {},  # phone -> timestamp
}


# ==============================================================================
# RATE LIMITING, PRIVACY & ELIGIBILITY CHECKS
# ==============================================================================

def _mask_phone(phone_number: str) -> str:
    """Masks a phone number for safe privacy logging (e.g. +91*****4321)."""
    clean = str(phone_number).strip()
    if len(clean) <= 4:
        return "***"
    return clean[:3] + "*" * (len(clean) - 7) + clean[-4:]


def validate_and_normalize_phone(
    phone_number: Any,
    default_country_code: str = "+91",
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validates and normalizes phone numbers to standard E.164 format (+[country_code][national_number]).
    Supports standard 10-digit national numbers (auto-prepending default country code),
    numbers with spaces, hyphens, parentheses, and pre-formatted E.164 strings.
    Rejects invalid characters, non-numeric noise, and invalid lengths (< 10 or > 15 digits).

    Returns:
        (is_valid: bool, normalized_e164: Optional[str], error_message: Optional[str])
    """
    if phone_number is None:
        return False, None, "Phone number cannot be empty"

    raw = str(phone_number).strip()
    if not raw:
        return False, None, "Phone number cannot be empty"

    # Remove standard formatting noise
    cleaned = (
        raw.replace(" ", "")
        .replace("-", "")
        .replace("(", "")
        .replace(")", "")
        .replace(".", "")
    )

    # Check for international prefix formats
    has_plus = cleaned.startswith("+")
    if cleaned.startswith("00"):
        cleaned = "+" + cleaned[2:]
        has_plus = True

    digits_only = cleaned[1:] if has_plus else cleaned

    if not digits_only.isdigit():
        return False, None, "Phone number contains invalid characters (digits only allowed)"

    # Handle standard 10-digit number without country code
    if not has_plus:
        if len(digits_only) == 10:
            cc = default_country_code if default_country_code.startswith("+") else f"+{default_country_code}"
            normalized = f"{cc}{digits_only}"
            return True, normalized, None
        elif len(digits_only) == 11 and digits_only.startswith("0"):
            cc = default_country_code if default_country_code.startswith("+") else f"+{default_country_code}"
            normalized = f"{cc}{digits_only[1:]}"
            return True, normalized, None
        elif 10 <= len(digits_only) <= 15:
            # Assume user omitted '+'
            normalized = f"+{digits_only}"
            return True, normalized, None
        else:
            return False, None, f"Invalid phone number length ({len(digits_only)} digits; must be 10-15 digits)"

    # Has '+'
    if len(digits_only) < 10 or len(digits_only) > 15:
        return False, None, f"Invalid E.164 phone number length ({len(digits_only)} digits; must be 10-15 digits)"

    normalized = f"+{digits_only}"
    return True, normalized, None


def check_and_reset_daily_counter() -> None:
    """Resets the daily counter at UTC midnight."""
    global _SMS_TRACKER
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if _SMS_TRACKER["current_date"] != today_str:
        _SMS_TRACKER["current_date"] = today_str
        _SMS_TRACKER["dispatches_today"] = 0
        _SMS_TRACKER["recipient_cooldowns"].clear()


def can_send_sms(phone_number: str, opt_out: bool = False) -> Tuple[bool, str]:
    """
    Evaluates whether an SMS can be dispatched based on opt-out, phone validation,
    global limits, and recipient cooldown.

    Returns:
        (eligible: bool, reason: str)
    """
    if opt_out:
        return False, "Recipient has opted out of SMS alerts"

    check_and_reset_daily_counter()

    valid, norm_phone, err = validate_and_normalize_phone(phone_number)
    if not valid:
        return False, err or "Invalid phone number"

    target_phone = norm_phone or phone_number

    # Check daily limit
    daily_limit = get_daily_limit()
    if _SMS_TRACKER["dispatches_today"] >= daily_limit:
        return False, f"Daily SMS safety limit of {daily_limit} reached"

    # Check recipient cooldown
    now = datetime.now(timezone.utc)
    cooldown_delta = timedelta(minutes=get_cooldown_minutes())
    last_sent = _SMS_TRACKER["recipient_cooldowns"].get(target_phone)

    if last_sent:
        if (now - last_sent) < cooldown_delta:
            remaining_mins = int((cooldown_delta - (now - last_sent)).total_seconds() / 60)
            return False, f"Recipient cooldown active ({remaining_mins} min remaining)"

    return True, "Eligible"


def record_sms_dispatch(phone_number: str) -> None:
    """Records an SMS dispatch to update rate trackers."""
    global _SMS_TRACKER
    check_and_reset_daily_counter()
    _SMS_TRACKER["dispatches_today"] += 1
    _SMS_TRACKER["recipient_cooldowns"][phone_number] = datetime.now(timezone.utc)


def reset_sms_stats() -> None:
    """Resets all SMS rate limits and cooldown trackers for testing."""
    global _SMS_TRACKER
    _SMS_TRACKER["dispatches_today"] = 0
    _SMS_TRACKER["current_date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    _SMS_TRACKER["recipient_cooldowns"].clear()


def get_sms_stats() -> Dict[str, Any]:
    """Returns current SMS dispatch stats."""
    check_and_reset_daily_counter()
    return {
        "sms_enabled": get_sms_enabled(),
        "dispatches_today": _SMS_TRACKER["dispatches_today"],
        "daily_limit": get_daily_limit(),
        "cooldown_minutes": get_cooldown_minutes(),
        "active_cooldowns_count": len(_SMS_TRACKER["recipient_cooldowns"]),
    }


def get_twilio_status() -> Dict[str, Any]:
    """
    Inspects current Twilio configuration status without exposing any secrets.
    Reports whether credentials are detected, sender is configured, and whether
    Twilio is in live or mock mode.
    """
    provider = ProviderFactory.get_sms_provider()
    if isinstance(provider, TwilioProvider) or hasattr(provider, "has_credentials"):
        has_creds = getattr(provider, "has_credentials", False)
        has_sender = getattr(provider, "has_sender_config", False)
        is_live = getattr(provider, "is_real_configured", False)
        missing_sender = getattr(provider, "missing_sender_config", False)
        sender_type = "from_number" if getattr(provider, "has_from_number", False) else (
            "messaging_service_sid" if getattr(provider, "has_messaging_service", False) else "none"
        )
        return {
            "provider": provider.name,
            "enabled": getattr(provider, "is_enabled", False),
            "credentials_detected": has_creds,
            "sender_configured": has_sender,
            "sender_type": sender_type,
            "mode": "LIVE" if is_live else "MOCK",
            "missing_sender_config": missing_sender,
        }
    return {
        "provider": getattr(provider, "name", "Unknown"),
        "credentials_detected": False,
        "sender_configured": False,
        "mode": "MOCK",
    }


# ==============================================================================
# SMS ALERT DISPATCHER
# ==============================================================================

def send_alert_sms(
    phone_number: str,
    message: str,
    ward_name: str,
    hazard_type: str,
    severity: str,
    template_id: Optional[str] = None,
    custom_provider: Optional[BaseNotificationProvider] = None,
    opt_out: bool = False,
) -> Dict[str, Any]:
    """
    Sends an SMS alert via the active SMS provider adapter (Twilio by default).

    Guarantees:
    - Enforces daily rate limits, per-recipient cooldown, and user opt-out.
    - Operates in mock mode safely if TWILIO_ENABLED is false or in test mode.
    - Masked phone logging to ensure privacy.
    - Failure never raises unhandled exceptions.
    """
    eligible, reason = can_send_sms(phone_number, opt_out=opt_out)
    if not eligible:
        return {
            "success": False,
            "error": reason,
            "dispatched": False,
            "recipient_masked": _mask_phone(phone_number),
        }

    provider = custom_provider or ProviderFactory.get_sms_provider()

    extra_params = {
        "ward": ward_name,
        "hazard": hazard_type,
        "severity": severity,
    }

    try:
        result = provider.send_sms(
            phone_number=phone_number,
            message=message,
            template_id=template_id,
            extra_params=extra_params,
        )

        if result.get("success"):
            record_sms_dispatch(phone_number)

        result["recipient_masked"] = _mask_phone(phone_number)
        return result
    except Exception as e:
        print(f"Note: Safe catch in send_alert_sms: {type(e).__name__}")
        return {
            "success": False,
            "provider": getattr(provider, "name", "SMSProvider"),
            "error": "SMS delivery failed safely",
            "status": "FAILED",
            "recipient_masked": _mask_phone(phone_number),
        }
