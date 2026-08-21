"""
Apada Sathi - Provider-Independent Notification & SMS Architecture
===================================================================

Defines abstract notification/SMS provider interfaces and concrete adapters:
1. BaseNotificationProvider (Abstract Base Class)
2. MockNotificationProvider (Zero-credential offline testing adapter)
3. FCMProvider (Firebase Cloud Messaging push notification adapter)
4. TwilioProvider (Twilio SMS adapter with API-Key authentication & Sender config)
5. Msg91Provider (MSG91 Flow & SMS API adapter)
6. GenericHttpSMSProvider (Configurable REST/HTTP SMS adapter)
7. ProviderFactory (Dynamic provider resolution and runtime injection)

CRITICAL ARCHITECTURAL CONSTRAINTS:
- risk_engine.py is the HEART of the system and is NEVER modified.
- Core notification logic is completely provider-independent.
- Switching providers requires ZERO changes to notification_service.py.
- Never prints or exposes API keys, private keys, or tokens.
"""

from abc import ABC, abstractmethod
from datetime import datetime, timezone
import json
import os
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
import requests

load_dotenv()

# ==============================================================================
# ABSTRACT BASE PROVIDER INTERFACE
# ==============================================================================

class BaseNotificationProvider(ABC):
    """
    Abstract interface for notification and SMS delivery providers.
    Every provider must adhere to this unified contract.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Returns the unique human-readable provider name."""
        pass

    @abstractmethod
    def send_push(
        self,
        recipient_token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Dispatches a push notification to a device token.

        Returns:
            Dict containing 'success' (bool), 'provider' (str), 'message_id' (str),
            and optional 'details' or 'error'.
        """
        pass

    @abstractmethod
    def send_sms(
        self,
        phone_number: str,
        message: str,
        template_id: Optional[str] = None,
        extra_params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Dispatches an SMS notification to a phone number.

        Returns:
            Dict containing 'success' (bool), 'provider' (str), 'message_id' (str),
            and optional 'details' or 'error'.
        """
        pass


# ==============================================================================
# 1. MOCK PROVIDER (OFFLINE & DETERMINISTIC TESTING)
# ==============================================================================

class MockNotificationProvider(BaseNotificationProvider):
    """
    In-memory mock provider operating with zero external credentials.
    Records all dispatched pushes and SMS messages for test assertions.
    """

    def __init__(self):
        self.sent_pushes: List[Dict[str, Any]] = []
        self.sent_sms: List[Dict[str, Any]] = []

    @property
    def name(self) -> str:
        return "MockNotificationProvider"

    def clear(self) -> None:
        """Clears in-memory sent logs."""
        self.sent_pushes.clear()
        self.sent_sms.clear()

    def send_push(
        self,
        recipient_token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        msg_id = f"mock_push_{len(self.sent_pushes) + 1}_{int(datetime.now(timezone.utc).timestamp())}"
        payload = {
            "message_id": msg_id,
            "recipient_token": recipient_token,
            "title": title,
            "body": body,
            "data": data or {},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self.sent_pushes.append(payload)
        return {
            "success": True,
            "provider": self.name,
            "message_id": msg_id,
            "status": "DELIVERED_MOCK",
        }

    def send_sms(
        self,
        phone_number: str,
        message: str,
        template_id: Optional[str] = None,
        extra_params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        msg_id = f"mock_sms_{len(self.sent_sms) + 1}_{int(datetime.now(timezone.utc).timestamp())}"
        payload = {
            "message_id": msg_id,
            "phone_number": phone_number,
            "message": message,
            "template_id": template_id,
            "extra_params": extra_params or {},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self.sent_sms.append(payload)
        return {
            "success": True,
            "provider": self.name,
            "message_id": msg_id,
            "status": "DELIVERED_MOCK",
        }


# ==============================================================================
# 2. FIREBASE CLOUD MESSAGING (FCM) PUSH PROVIDER
# ==============================================================================

class FCMProvider(BaseNotificationProvider):
    """
    Firebase Cloud Messaging (FCM) Push Provider Adapter using Firebase Admin SDK.
    Supports secure authentication via:
    1. Firebase Service Account JSON credential file (GOOGLE_APPLICATION_CREDENTIALS
       or FIREBASE_SERVICE_ACCOUNT_PATH).
    2. Individual environment variables (FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY).
    
    Gracefully runs in simulated mock mode when FCM_ENABLED == 'false' or when
    credentials are missing/placeholders. Never logs or prints private keys or JSON contents.
    """

    def __init__(
        self,
        credentials_path: Optional[str] = None,
        project_id: Optional[str] = None,
        client_email: Optional[str] = None,
        private_key: Optional[str] = None,
        is_enabled: Optional[bool] = None,
    ):
        raw_cred_path = (
            credentials_path
            or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
            or os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH")
            or os.environ.get("FCM_CREDENTIALS_PATH")
            or ""
        )

        def _resolve_file_path(path_str: Optional[str]) -> Optional[str]:
            if not path_str or str(path_str).strip().startswith("PASTE_"):
                return None
            p = str(path_str).strip()
            if os.path.isfile(p):
                return os.path.abspath(p)
            script_dir = os.path.dirname(os.path.abspath(__file__))
            joined = os.path.join(script_dir, p)
            if os.path.isfile(joined):
                return joined
            return None

        self.credentials_path = _resolve_file_path(raw_cred_path)
        self.project_id = project_id or os.environ.get("FCM_PROJECT_ID", "")
        self.client_email = client_email or os.environ.get("FCM_CLIENT_EMAIL", "")
        self.private_key = private_key or os.environ.get("FCM_PRIVATE_KEY", "")
        
        self.json_string = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON_STRING", "").strip()

        if is_enabled is not None:
            self.is_enabled = bool(is_enabled)
        else:
            self.is_enabled = os.environ.get("FCM_ENABLED", "false").lower() == "true"

        self._firebase_initialized = False
        self._mock_fallback = MockNotificationProvider()

        # Detection logic
        def _is_valid(val: Optional[str]) -> bool:
            return bool(val) and not str(val).strip().startswith("PASTE_")

        self.has_json_file = bool(self.credentials_path and os.path.isfile(self.credentials_path))
        self.has_json_string = _is_valid(self.json_string)
        self.has_env_creds = (
            _is_valid(self.project_id)
            and _is_valid(self.client_email)
            and _is_valid(self.private_key)
        )
        self.has_credentials = self.has_json_file or self.has_env_creds or self.has_json_string
        self.is_real_configured = self.is_enabled and self.has_credentials

        if self.is_real_configured:
            self._initialize_firebase()

    @property
    def name(self) -> str:
        return "FCMProvider"

    def _initialize_firebase(self) -> None:
        """Initializes the Firebase Admin SDK securely without exposing secrets."""
        try:
            import firebase_admin
            from firebase_admin import credentials

            if not firebase_admin._apps:
                if self.has_json_string:
                    import json
                    cred_dict = json.loads(self.json_string)
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred)
                elif self.has_json_file and self.credentials_path:
                    cred = credentials.Certificate(self.credentials_path)
                    firebase_admin.initialize_app(cred)
                elif self.has_env_creds:
                    cred_dict = {
                        "type": "service_account",
                        "project_id": self.project_id,
                        "private_key": self.private_key.replace("\\n", "\n"),
                        "client_email": self.client_email,
                        "token_uri": "https://oauth2.googleapis.com/token",
                    }
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred)
            self._firebase_initialized = True
        except Exception as e:
            print(f"Note: FCM initialization skipped / fallback to mock mode: {type(e).__name__}")
            self._firebase_initialized = False

    def send_push(
        self,
        recipient_token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Dispatches an FCM push notification or simulates delivery if in mock mode."""
        if not self.is_real_configured or not self._firebase_initialized:
            # Safe mock fallback
            res = self._mock_fallback.send_push(recipient_token, title, body, data)
            res["provider"] = self.name
            res["mode"] = "SIMULATED_MOCK"
            res["credentials_detected"] = self.has_credentials
            return res

        try:
            from firebase_admin import messaging

            # Convert data values to strings as required by FCM
            string_data = {k: str(v) for k, v in (data or {}).items()}

            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data=string_data,
                token=recipient_token,
            )
            response = messaging.send(message)
            return {
                "success": True,
                "provider": self.name,
                "message_id": response,
                "status": "SENT_FCM",
                "mode": "LIVE",
            }
        except Exception as e:
            # Safe catch: Never crash callers, never leak private keys
            print(f"Note: FCM push delivery error (safe catch): {type(e).__name__}")
            return {
                "success": False,
                "provider": self.name,
                "error": "FCM delivery failed safely",
                "status": "FAILED",
                "details": str(e),
            }

    def send_sms(
        self,
        phone_number: str,
        message: str,
        template_id: Optional[str] = None,
        extra_params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """FCM is exclusively a push provider; delegates SMS if called."""
        return {
            "success": False,
            "provider": self.name,
            "error": "FCM does not support SMS delivery",
        }


# ==============================================================================
# 3. TWILIO SMS PROVIDER (API-KEY AUTHENTICATION & FLEXIBLE SENDER)
# ==============================================================================

class TwilioProvider(BaseNotificationProvider):
    """
    Twilio SMS Provider Adapter supporting:
    1. API-Key Authentication (TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET)
       without requiring TWILIO_AUTH_TOKEN.
    2. Flexible Sender Configuration:
       - TWILIO_FROM_NUMBER (sender phone number) OR
       - TWILIO_MESSAGING_SERVICE_SID (Messaging Service SID).
    3. Resilient Fallback:
       - Operates in mock mode if TWILIO_ENABLED == 'false' or placeholder keys are present.
       - If credentials are valid but sender is missing, falls back to mock mode safely
         and reports the missing sender configuration without crashing.
    4. Safe Error Handling:
       - Catches all Twilio and network errors to prevent crashes in callers or scheduler.
       - Never exposes API keys, secrets, or raw phone numbers in logs.
    """

    def __init__(
        self,
        account_sid: Optional[str] = None,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        auth_token: Optional[str] = None,
        from_number: Optional[str] = None,
        messaging_service_sid: Optional[str] = None,
        is_enabled: Optional[bool] = None,
    ):
        self.account_sid = account_sid or os.environ.get("TWILIO_ACCOUNT_SID", "")
        self.api_key = api_key or os.environ.get("TWILIO_API_KEY", "")
        self.api_secret = api_secret or os.environ.get("TWILIO_API_SECRET", "")
        self.auth_token = auth_token or os.environ.get("TWILIO_AUTH_TOKEN", "")
        self.from_number = from_number or os.environ.get("TWILIO_FROM_NUMBER", "")
        self.messaging_service_sid = messaging_service_sid or os.environ.get("TWILIO_MESSAGING_SERVICE_SID", "")

        if is_enabled is not None:
            self.is_enabled = bool(is_enabled)
        else:
            self.is_enabled = (
                os.environ.get("TWILIO_ENABLED", os.environ.get("SMS_ENABLED", "false")).lower() == "true"
            )

        self._mock_fallback = MockNotificationProvider()

        # Detection logic
        def _is_valid(val: Optional[str]) -> bool:
            return bool(val) and not str(val).strip().startswith("PASTE_")

        self.has_account_sid = _is_valid(self.account_sid)
        self.has_api_key_auth = _is_valid(self.api_key) and _is_valid(self.api_secret)
        self.has_auth_token_auth = _is_valid(self.auth_token)
        self.has_credentials = self.has_account_sid and (self.has_api_key_auth or self.has_auth_token_auth)

        self.has_from_number = _is_valid(self.from_number)
        self.has_messaging_service = _is_valid(self.messaging_service_sid)
        self.has_sender_config = self.has_from_number or self.has_messaging_service

        self.is_real_configured = self.is_enabled and self.has_credentials and self.has_sender_config
        self.missing_sender_config = self.is_enabled and self.has_credentials and not self.has_sender_config

    @property
    def name(self) -> str:
        return "TwilioProvider"

    def send_push(
        self,
        recipient_token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Twilio is exclusively an SMS provider; push is handled by FCM."""
        return {
            "success": False,
            "provider": self.name,
            "error": "Twilio is exclusively an SMS provider",
        }

    def send_sms(
        self,
        phone_number: str,
        message: str,
        template_id: Optional[str] = None,
        extra_params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Dispatches an SMS notification via Twilio using API-key authentication
        and either sender phone number or Messaging Service SID.
        """
        if not self.is_real_configured:
            # Safe mock fallback mode
            res = self._mock_fallback.send_sms(phone_number, message, template_id, extra_params)
            res["provider"] = self.name
            res["mode"] = "SIMULATED_MOCK"
            res["credentials_detected"] = self.has_credentials
            res["sender_configured"] = self.has_sender_config
            if self.missing_sender_config:
                res["warning"] = "Twilio credentials detected but sender configuration (TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID) is missing. Operating safely in mock mode."
            return res

        try:
            from twilio.rest import Client

            if self.has_api_key_auth:
                # Primary API-Key authentication method
                client = Client(self.api_key, self.api_secret, account_sid=self.account_sid)
            else:
                # Fallback auth token if configured
                client = Client(self.account_sid, self.auth_token)

            send_kwargs: Dict[str, Any] = {
                "to": phone_number,
                "body": message,
            }

            if self.has_from_number:
                send_kwargs["from_"] = self.from_number
            elif self.has_messaging_service:
                send_kwargs["messaging_service_sid"] = self.messaging_service_sid

            twilio_msg = client.messages.create(**send_kwargs)
            msg_sid = getattr(twilio_msg, "sid", f"twilio_sms_{int(datetime.now(timezone.utc).timestamp())}")

            return {
                "success": True,
                "provider": self.name,
                "message_id": msg_sid,
                "status": "SENT_TWILIO",
                "mode": "LIVE",
                "sender_type": "from_number" if self.has_from_number else "messaging_service_sid",
            }
        except Exception as e:
            # Safe catch: Never crash callers, never leak credentials or raw phone numbers
            print(f"Note: Twilio SMS delivery exception (safe catch): {type(e).__name__}")
            return {
                "success": False,
                "provider": self.name,
                "error": "Twilio delivery failed safely",
                "status": "FAILED",
                "details": str(e),
            }


# ==============================================================================
# 4. MSG91 PROVIDER (INDIAN SMS ADAPTER)
# ==============================================================================

class Msg91Provider(BaseNotificationProvider):
    """
    MSG91 SMS Provider Adapter supporting Flow API and direct SMS endpoints.
    Gracefully runs in simulated mock mode when SMS_ENABLED == 'false' or
    when placeholder keys are present.
    """

    def __init__(self):
        self.auth_key = os.environ.get("MSG91_AUTH_KEY", "")
        self.flow_id = os.environ.get("MSG91_FLOW_ID", "")
        self.sender_id = os.environ.get("MSG91_SENDER_ID", "")
        self.is_enabled = os.environ.get("SMS_ENABLED", "false").lower() == "true"
        self._mock_fallback = MockNotificationProvider()

        self.is_real_configured = (
            self.is_enabled
            and bool(self.auth_key)
            and not self.auth_key.startswith("PASTE_")
        )

    @property
    def name(self) -> str:
        return "Msg91Provider"

    def send_push(
        self,
        recipient_token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        return {
            "success": False,
            "provider": self.name,
            "error": "Msg91 is exclusively an SMS provider",
        }

    def send_sms(
        self,
        phone_number: str,
        message: str,
        template_id: Optional[str] = None,
        extra_params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        if not self.is_real_configured:
            # Safe mock mode
            res = self._mock_fallback.send_sms(phone_number, message, template_id, extra_params)
            res["provider"] = self.name
            res["mode"] = "SIMULATED_MOCK"
            return res

        try:
            url = "https://control.msg91.com/api/v5/flow/"
            headers = {
                "authkey": self.auth_key,
                "content-type": "application/json",
            }
            # Clean recipient phone number
            clean_mobile = phone_number.replace("+", "").replace(" ", "").replace("-", "")

            payload = {
                "template_id": template_id or self.flow_id,
                "sender": self.sender_id,
                "short_url": "1",
                "recipients": [
                    {
                        "mobiles": clean_mobile,
                        "message": message,
                        **(extra_params or {}),
                    }
                ],
            }

            resp = requests.post(url, json=payload, headers=headers, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "success": True,
                    "provider": self.name,
                    "message_id": data.get("message", "msg91_success"),
                    "status": "SENT_MSG91",
                }
            else:
                return {
                    "success": False,
                    "provider": self.name,
                    "error": f"MSG91 returned HTTP {resp.status_code}",
                    "status": "FAILED",
                }
        except Exception as e:
            print(f"Note: Msg91 delivery exception (safe catch): {e}")
            return {
                "success": False,
                "provider": self.name,
                "error": "Msg91 delivery failed safely",
                "status": "FAILED",
            }


# ==============================================================================
# 4. GENERIC HTTP / REST SMS PROVIDER
# ==============================================================================

class GenericHttpSMSProvider(BaseNotificationProvider):
    """
    Configurable REST/HTTP SMS Adapter.
    Allows integrating compatible external SMS gateways by specifying URL,
    authentication, headers, and parameter mappings via configuration.
    """

    def __init__(
        self,
        api_url: Optional[str] = None,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        sender_id: Optional[str] = None,
        template_id: Optional[str] = None,
        http_method: str = "POST",
        custom_headers: Optional[Dict[str, str]] = None,
    ):
        self.api_url = api_url or os.environ.get("SMS_API_URL", "")
        self.api_key = api_key or os.environ.get("SMS_API_KEY", "")
        self.api_secret = api_secret or os.environ.get("SMS_API_SECRET", "")
        self.sender_id = sender_id or os.environ.get("SMS_SENDER_ID", "")
        self.template_id = template_id or os.environ.get("SMS_TEMPLATE_ID", "")
        self.http_method = http_method.upper()
        self.custom_headers = custom_headers or {}
        self.is_enabled = os.environ.get("SMS_ENABLED", "false").lower() == "true"
        self._mock_fallback = MockNotificationProvider()

        self.is_real_configured = (
            self.is_enabled
            and bool(self.api_url)
            and not self.api_url.startswith("PASTE_")
        )

    @property
    def name(self) -> str:
        return "GenericHttpSMSProvider"

    def send_push(
        self,
        recipient_token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        return {
            "success": False,
            "provider": self.name,
            "error": "GenericHttpSMSProvider is exclusively an SMS provider",
        }

    def send_sms(
        self,
        phone_number: str,
        message: str,
        template_id: Optional[str] = None,
        extra_params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        if not self.is_real_configured:
            # Safe mock mode
            res = self._mock_fallback.send_sms(phone_number, message, template_id, extra_params)
            res["provider"] = self.name
            res["mode"] = "SIMULATED_MOCK"
            return res

        try:
            headers = {"Content-Type": "application/json", **self.custom_headers}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            payload = {
                "to": phone_number,
                "message": message,
                "sender": self.sender_id,
                "template_id": template_id or self.template_id,
                **(extra_params or {}),
            }

            if self.http_method == "POST":
                resp = requests.post(self.api_url, json=payload, headers=headers, timeout=8)
            else:
                resp = requests.get(self.api_url, params=payload, headers=headers, timeout=8)

            if resp.status_code in (200, 201, 202):
                return {
                    "success": True,
                    "provider": self.name,
                    "message_id": f"http_sms_{int(datetime.now(timezone.utc).timestamp())}",
                    "status": "SENT_HTTP_SMS",
                }
            else:
                return {
                    "success": False,
                    "provider": self.name,
                    "error": f"HTTP SMS Provider returned status {resp.status_code}",
                    "status": "FAILED",
                }
        except Exception as e:
            print(f"Note: Generic HTTP SMS delivery exception (safe catch): {e}")
            return {
                "success": False,
                "provider": self.name,
                "error": "Generic HTTP SMS delivery failed safely",
                "status": "FAILED",
            }


# ==============================================================================
# PROVIDER FACTORY & RESOLVER
# ==============================================================================

class ProviderFactory:
    """
    Factory resolving active Push and SMS delivery providers dynamically
    based on configuration without changing notification engine logic.
    """

    _global_mock_override: Optional[BaseNotificationProvider] = None

    @classmethod
    def set_global_mock_mode(cls, mock_provider: Optional[BaseNotificationProvider] = None) -> None:
        """Overrides providers globally with an in-memory mock for automated testing."""
        cls._global_mock_override = mock_provider or MockNotificationProvider()

    @classmethod
    def reset_global_mock_mode(cls) -> None:
        """Restores normal provider resolution."""
        cls._global_mock_override = None

    @classmethod
    def get_push_provider(cls, provider_type: Optional[str] = None) -> BaseNotificationProvider:
        """Returns the configured push notification provider."""
        if cls._global_mock_override is not None:
            return cls._global_mock_override

        ptype = (provider_type or os.environ.get("PUSH_PROVIDER", "fcm")).lower().strip()
        if ptype == "fcm":
            return FCMProvider()
        elif ptype == "mock":
            return MockNotificationProvider()
        return FCMProvider()

    @classmethod
    def get_sms_provider(cls, provider_type: Optional[str] = None) -> BaseNotificationProvider:
        """Returns the configured SMS provider (defaults to TwilioProvider)."""
        if cls._global_mock_override is not None:
            return cls._global_mock_override

        stype = (provider_type or os.environ.get("SMS_PROVIDER", "twilio")).lower().strip()
        if stype in ("twilio", "twillio"):
            return TwilioProvider()
        elif stype == "msg91":
            return Msg91Provider()
        elif stype == "generic_http":
            return GenericHttpSMSProvider()
        elif stype == "mock":
            return MockNotificationProvider()
        return TwilioProvider()
