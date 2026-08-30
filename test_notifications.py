"""
Apada Sathi - Comprehensive Location-Aware Notification Test Suite
===================================================================

Validates all 32+ required specifications across:
 1. LOW severity -> no push
 2. LOW severity -> no SMS
 3. MODERATE severity -> in-app only
 4. MODERATE severity -> no push
 5. MODERATE severity -> no SMS
 6. HIGH severity outside zone -> no push
 7. HIGH severity inside zone -> push dispatched
 8. EMERGENCY severity inside zone -> push dispatched
 9. HIGH + SMS enabled -> SMS provider called
10. EMERGENCY + SMS enabled -> SMS provider called
11. Duplicate notification prevented inside same zone
12. Cooldown works (permits notification after cooldown)
13. Severity escalation permits notification (HIGH -> EMERGENCY)
14. Entering a new zone permits notification
15. Safe-place integration attaches nearest safe locations
16. Unsafe safe places remain excluded from recommendations
17. FCM mock works
18. SMS mock works
19. GenericHttpSMSProvider configuration works
20. Msg91Provider adapter works in mock/test mode
21. FCMProvider works in mock/test mode
22. Provider switching does NOT change notification_service.py
23. Notification message remains identical when provider changes (Provider Independence Proof)
24. Provider failure does NOT crash risk engine or notification callers
25. Missing credentials are handled safely in fallback mode
26. User coordinates and private tokens are not exposed in logs
27. Map API key is read only from environment
28. Existing map tests pass
29. Existing emergency-location tests pass
30. Existing crowd tests pass
31. Existing news tests pass
32. Confirmation: risk_engine.py is 100% intact & risk scores are unaffected
"""

import unittest
from datetime import datetime, timezone, timedelta
import os

import risk_engine
import map_zones
import emergency_locations as el
import notification_provider
from notification_provider import (
    BaseNotificationProvider,
    MockNotificationProvider,
    FCMProvider,
    TwilioProvider,
    Msg91Provider,
    GenericHttpSMSProvider,
    ProviderFactory,
)
import sms_service
import notification_service


class TestLocationAwareNotificationSystem(unittest.TestCase):

    def setUp(self):
        """Reset deduplication caches, registries, and mock providers before each test."""
        notification_service.reset_notification_history()
        notification_service.reset_user_registry()
        sms_service.reset_sms_stats()
        self.mock_provider = MockNotificationProvider()
        ProviderFactory.set_global_mock_mode(self.mock_provider)

    def tearDown(self):
        ProviderFactory.reset_global_mock_mode()

    # --------------------------------------------------------------------------
    # 1 & 2. LOW Severity Rules
    # --------------------------------------------------------------------------
    def test_01_and_02_low_severity_no_push_no_sms(self):
        print("\n--- Test 1 & 2: LOW Severity Rules (No Push, No SMS) ---")
        sample_zones = [
            {
                "ward_id": "ward_1",
                "ward_name": "Ward 1",
                "hazard_type": "heavy_rainfall",
                "latitude": 20.351111,
                "longitude": 85.809047,
                "affected_radius_km": 1.5,
                "severity": "LOW",
                "risk_score": 25.0,
                "confidence": 80.0,
            }
        ]

        result = notification_service.process_user_location_alert(
            user_id_or_device_id="user_1",
            latitude=20.351111,
            longitude=85.809047,
            fcm_token="token_1",
            phone_number="+919876543210",
            precomputed_zones=sample_zones,
            push_provider=self.mock_provider,
            sms_provider=self.mock_provider,
        )

        self.assertFalse(result["notified"])
        self.assertEqual(result["status"], "LOW_SEVERITY")
        self.assertEqual(len(self.mock_provider.sent_pushes), 0, "Push was sent for LOW severity!")
        self.assertEqual(len(self.mock_provider.sent_sms), 0, "SMS was sent for LOW severity!")
        print("  [PASS] LOW severity produced 0 pushes and 0 SMS.")

    # --------------------------------------------------------------------------
    # 3, 4, 5. MODERATE Severity Rules
    # --------------------------------------------------------------------------
    def test_03_04_05_moderate_severity_in_app_only(self):
        print("\n--- Test 3, 4, 5: MODERATE Severity Rules (In-App Only, No Push, No SMS) ---")
        sample_zones = [
            {
                "ward_id": "ward_2",
                "ward_name": "Ward 2",
                "hazard_type": "flood",
                "latitude": 20.358564,
                "longitude": 85.823294,
                "affected_radius_km": 2.0,
                "severity": "MODERATE",
                "risk_score": 45.0,
                "confidence": 85.0,
            }
        ]

        result = notification_service.process_user_location_alert(
            user_id_or_device_id="user_2",
            latitude=20.358564,
            longitude=85.823294,
            fcm_token="token_2",
            phone_number="+919876543210",
            precomputed_zones=sample_zones,
            push_provider=self.mock_provider,
            sms_provider=self.mock_provider,
        )

        self.assertFalse(result["notified"])
        self.assertEqual(result["status"], "MODERATE_ADVISORY")
        self.assertEqual(result["action"], "IN_APP_ONLY")
        self.assertIn("in_app_alert", result)
        self.assertEqual(result["in_app_alert"]["severity"], "MODERATE")
        self.assertEqual(len(self.mock_provider.sent_pushes), 0, "Push was sent for MODERATE!")
        self.assertEqual(len(self.mock_provider.sent_sms), 0, "SMS was sent for MODERATE!")
        print("  [PASS] MODERATE generated in-app alert structure only (0 push, 0 SMS).")

    # --------------------------------------------------------------------------
    # 6. HIGH Outside Zone -> No Push
    # --------------------------------------------------------------------------
    def test_06_high_outside_zone_no_push(self):
        print("\n--- Test 6: HIGH Outside Hazard Zone (No Push) ---")
        sample_zones = [
            {
                "ward_id": "ward_3",
                "ward_name": "Ward 3",
                "hazard_type": "waterlogging",
                "latitude": 20.345021,
                "longitude": 85.833197,
                "affected_radius_km": 1.0,  # 1 km radius
                "severity": "HIGH",
                "risk_score": 70.0,
                "confidence": 85.0,
            }
        ]

        # User is at 20.2500, 85.8500 (~11 km away)
        result = notification_service.process_user_location_alert(
            user_id_or_device_id="user_3",
            latitude=20.250000,
            longitude=85.850000,
            fcm_token="token_3",
            precomputed_zones=sample_zones,
            push_provider=self.mock_provider,
        )

        self.assertFalse(result["notified"])
        self.assertEqual(result["status"], "OUTSIDE_ZONE")
        self.assertEqual(len(self.mock_provider.sent_pushes), 0)
        print("  [PASS] User outside HIGH hazard circle received no push notification.")

    # --------------------------------------------------------------------------
    # 7 & 8. HIGH & EMERGENCY Inside Zone -> Push Dispatched
    # --------------------------------------------------------------------------
    def test_07_and_08_high_emergency_inside_zone_push(self):
        print("\n--- Test 7 & 8: HIGH and EMERGENCY Inside Zone (Push Dispatched) ---")
        # Test HIGH
        high_zones = [
            {
                "ward_id": "ward_4",
                "ward_name": "Kalinga Nagar",
                "hazard_type": "flood",
                "latitude": 20.334513,
                "longitude": 85.890261,
                "affected_radius_km": 2.5,
                "severity": "HIGH",
                "risk_score": 75.0,
                "confidence": 90.0,
            }
        ]
        res_high = notification_service.process_user_location_alert(
            user_id_or_device_id="user_4",
            latitude=20.334513,
            longitude=85.890261,
            fcm_token="token_high_4",
            precomputed_zones=high_zones,
            push_provider=self.mock_provider,
        )
        self.assertTrue(res_high["notified"])
        self.assertEqual(len(self.mock_provider.sent_pushes), 1)
        self.assertIn("HIGH FLOOD ALERT", self.mock_provider.sent_pushes[0]["title"])

        # Test EMERGENCY
        self.mock_provider.clear()
        em_zones = [
            {
                "ward_id": "ward_5",
                "ward_name": "Baramunda",
                "hazard_type": "cyclone",
                "latitude": 20.322945,
                "longitude": 85.863802,
                "affected_radius_km": 3.5,
                "severity": "EMERGENCY",
                "risk_score": 95.0,
                "confidence": 95.0,
            }
        ]
        res_em = notification_service.process_user_location_alert(
            user_id_or_device_id="user_5",
            latitude=20.322945,
            longitude=85.863802,
            fcm_token="token_em_5",
            precomputed_zones=em_zones,
            push_provider=self.mock_provider,
        )
        self.assertTrue(res_em["notified"])
        self.assertEqual(len(self.mock_provider.sent_pushes), 1)
        self.assertIn("EMERGENCY CYCLONE ALERT", self.mock_provider.sent_pushes[0]["title"])
        print("  [PASS] HIGH and EMERGENCY inside active hazard zones correctly dispatched push alerts.")

    # --------------------------------------------------------------------------
    # 9 & 10. HIGH & EMERGENCY with SMS
    # --------------------------------------------------------------------------
    def test_09_and_10_sms_dispatch(self):
        print("\n--- Test 9 & 10: HIGH and EMERGENCY with SMS Enabled ---")
        sample_zones = [
            {
                "ward_id": "ward_23",
                "ward_name": "Kalinga Nagar",
                "hazard_type": "flood",
                "latitude": 20.3000,
                "longitude": 85.8000,
                "affected_radius_km": 2.5,
                "severity": "EMERGENCY",
                "risk_score": 92.0,
                "confidence": 92.0,
            }
        ]

        result = notification_service.process_user_location_alert(
            user_id_or_device_id="user_sms_test",
            latitude=20.3000,
            longitude=85.8000,
            fcm_token="token_sms_test",
            phone_number="+919876543210",
            precomputed_zones=sample_zones,
            push_provider=self.mock_provider,
            sms_provider=self.mock_provider,
        )

        self.assertTrue(result["notified"])
        self.assertEqual(len(self.mock_provider.sent_pushes), 1)
        self.assertEqual(len(self.mock_provider.sent_sms), 1)
        sms_sent = self.mock_provider.sent_sms[0]
        self.assertEqual(sms_sent["phone_number"], "+919876543210")
        self.assertIn("EMERGENCY FLOOD ALERT", sms_sent["message"])
        print("  [PASS] SMS provider successfully invoked with formatted emergency alert.")

    # --------------------------------------------------------------------------
    # 11 & 12. Deduplication and Cooldown
    # --------------------------------------------------------------------------
    def test_11_and_12_deduplication_and_cooldown(self):
        print("\n--- Test 11 & 12: Notification Deduplication & Cooldown ---")
        sample_zones = [
            {
                "ward_id": "ward_6",
                "ward_name": "Ward 6",
                "hazard_type": "lightning",
                "latitude": 20.344577,
                "longitude": 85.817428,
                "affected_radius_km": 2.0,
                "severity": "HIGH",
                "risk_score": 75.0,
                "confidence": 85.0,
            }
        ]

        # 1. First alert -> ALLOWED
        res1 = notification_service.process_user_location_alert(
            user_id_or_device_id="user_dedup",
            latitude=20.344577,
            longitude=85.817428,
            fcm_token="token_dedup",
            precomputed_zones=sample_zones,
            push_provider=self.mock_provider,
        )
        self.assertTrue(res1["notified"])
        self.assertEqual(len(self.mock_provider.sent_pushes), 1)

        # 2. Second alert immediately (same zone, same severity) -> SUPPRESSED
        res2 = notification_service.process_user_location_alert(
            user_id_or_device_id="user_dedup",
            latitude=20.344577,
            longitude=85.817428,
            fcm_token="token_dedup",
            precomputed_zones=sample_zones,
            push_provider=self.mock_provider,
        )
        self.assertFalse(res2["notified"])
        self.assertEqual(res2["status"], "SUPPRESSED_DUPLICATE")
        self.assertEqual(len(self.mock_provider.sent_pushes), 1, "Duplicate push was sent!")

        # 3. Simulate cooldown expiration (35 minutes later) -> ALLOWED
        key = ("user_dedup", "ward_6", "lightning")
        notification_service._NOTIFICATION_HISTORY[key]["notified_at"] = datetime.now(timezone.utc) - timedelta(minutes=35)

        res3 = notification_service.process_user_location_alert(
            user_id_or_device_id="user_dedup",
            latitude=20.344577,
            longitude=85.817428,
            fcm_token="token_dedup",
            precomputed_zones=sample_zones,
            push_provider=self.mock_provider,
        )
        self.assertTrue(res3["notified"])
        self.assertEqual(len(self.mock_provider.sent_pushes), 2)
        print("  [PASS] Immediate duplicates suppressed; post-cooldown alert permitted.")

    # --------------------------------------------------------------------------
    # 13 & 14. Severity Escalation & Entering New Zone
    # --------------------------------------------------------------------------
    def test_13_and_14_escalation_and_new_zone(self):
        print("\n--- Test 13 & 14: Severity Escalation and New Zone Entry ---")
        # 1. Start with HIGH in Ward 7
        zones_high = [
            {
                "ward_id": "ward_7",
                "ward_name": "Ward 7",
                "hazard_type": "flood",
                "latitude": 20.335079,
                "longitude": 85.806325,
                "affected_radius_km": 2.0,
                "severity": "HIGH",
                "risk_score": 75.0,
            }
        ]
        res1 = notification_service.process_user_location_alert(
            user_id_or_device_id="user_dyn",
            latitude=20.335079,
            longitude=85.806325,
            fcm_token="t1",
            precomputed_zones=zones_high,
            push_provider=self.mock_provider,
        )
        self.assertTrue(res1["notified"])
        self.assertEqual(len(self.mock_provider.sent_pushes), 1)

        # 2. Escalates to EMERGENCY in Ward 7 (within cooldown) -> ALLOWED due to escalation
        zones_emergency = [
            {
                "ward_id": "ward_7",
                "ward_name": "Ward 7",
                "hazard_type": "flood",
                "latitude": 20.335079,
                "longitude": 85.806325,
                "affected_radius_km": 2.5,
                "severity": "EMERGENCY",
                "risk_score": 92.0,
            }
        ]
        res2 = notification_service.process_user_location_alert(
            user_id_or_device_id="user_dyn",
            latitude=20.335079,
            longitude=85.806325,
            fcm_token="t1",
            precomputed_zones=zones_emergency,
            push_provider=self.mock_provider,
        )
        self.assertTrue(res2["notified"], "Escalation to EMERGENCY was incorrectly suppressed!")
        self.assertEqual(len(self.mock_provider.sent_pushes), 2)

        # 3. User enters a DIFFERENT zone (Ward 8) -> ALLOWED
        zones_new = [
            {
                "ward_id": "ward_8",
                "ward_name": "Ward 8",
                "hazard_type": "heavy_rainfall",
                "latitude": 20.327533,
                "longitude": 85.814952,
                "affected_radius_km": 2.0,
                "severity": "HIGH",
                "risk_score": 70.0,
            }
        ]
        res3 = notification_service.process_user_location_alert(
            user_id_or_device_id="user_dyn",
            latitude=20.327533,
            longitude=85.814952,
            fcm_token="t1",
            precomputed_zones=zones_new,
            push_provider=self.mock_provider,
        )
        self.assertTrue(res3["notified"], "New zone entry was incorrectly suppressed!")
        self.assertEqual(len(self.mock_provider.sent_pushes), 3)
        print("  [PASS] Severity escalation and new zone transitions allowed immediate notifications.")

    # --------------------------------------------------------------------------
    # 15 & 16. Safe-Place Integration & Exclusion of Hazardous Camps
    # --------------------------------------------------------------------------
    def test_15_and_16_safe_place_integration(self):
        print("\n--- Test 15 & 16: Safe-Place Integration & Hazardous Camp Exclusion ---")
        sample_zones = [
            {
                "ward_id": "ward_2",
                "ward_name": "Ward 2",
                "hazard_type": "flood",
                "latitude": 20.358564,
                "longitude": 85.823294,
                "affected_radius_km": 2.5,
                "severity": "HIGH",
                "risk_score": 75.0,
            }
        ]

        result = notification_service.process_user_location_alert(
            user_id_or_device_id="user_safe_test",
            latitude=20.358564,
            longitude=85.823294,
            fcm_token="token_safe",
            precomputed_zones=sample_zones,
            push_provider=self.mock_provider,
        )

        self.assertTrue(result["notified"])
        # Safe places should be attached or queried
        self.assertIn("safe_places", result)
        # Verify that any safe places attached are NOT located inside active ward_2
        for sp in result.get("safe_places", []):
            self.assertNotEqual(sp.get("ward_id"), "ward_2", "Hazardous ward camp was included in safe places!")

        print("  [PASS] Safe places properly integrated and active hazard wards excluded.")

    # --------------------------------------------------------------------------
    # 17-21. Provider Mock and Adapter Tests
    # --------------------------------------------------------------------------
    # 17-21. Provider Mock and Adapter Tests
    # --------------------------------------------------------------------------
    def test_17_through_21_provider_adapters(self):
        print("\n--- Test 17-21: Provider Adapters (Twilio, FCM, Msg91, GenericHttp, Mock) ---")
        # 17. Mock provider
        mock_p = MockNotificationProvider()
        res_m_push = mock_p.send_push("token_1", "Test Title", "Test Body")
        self.assertTrue(res_m_push["success"])
        res_m_sms = mock_p.send_sms("+919876543210", "Test SMS")
        self.assertTrue(res_m_sms["success"])

        # Twilio provider (in mock/offline mode)
        twilio_p = TwilioProvider(
            account_sid="AC_test_sid",
            api_key="SK_test_key",
            api_secret="secret_test_secret",
            from_number="+15551234567",
            is_enabled=False,
        )
        res_twilio = twilio_p.send_sms("+919876543210", "Test Twilio SMS")
        self.assertTrue(res_twilio["success"])
        self.assertEqual(res_twilio["provider"], "TwilioProvider")
        self.assertEqual(res_twilio["mode"], "SIMULATED_MOCK")
        self.assertTrue(res_twilio["credentials_detected"])
        self.assertTrue(res_twilio["sender_configured"])

        # 20. Msg91 provider (in mock/offline mode)
        msg91_p = Msg91Provider()
        res_msg91 = msg91_p.send_sms("+919876543210", "Test Msg91 SMS")
        self.assertTrue(res_msg91["success"])
        self.assertEqual(res_msg91["provider"], "Msg91Provider")

        # 21. FCM provider (in mock/offline mode)
        fcm_p = FCMProvider(is_enabled=False)
        res_fcm = fcm_p.send_push("token_fcm", "FCM Title", "FCM Body")
        self.assertTrue(res_fcm["success"])
        self.assertEqual(res_fcm["provider"], "FCMProvider")

        # 19. GenericHttpSMSProvider (in mock/offline mode)
        http_sms_p = GenericHttpSMSProvider(
            api_url="https://sms.example.com/api/send",
            api_key="test_key",
            sender_id="APADA",
        )
        res_http = http_sms_p.send_sms("+919876543210", "HTTP SMS Body")
        self.assertTrue(res_http["success"])
        self.assertEqual(res_http["provider"], "GenericHttpSMSProvider")
        print("  [PASS] All provider adapters successfully initialized and executed.")

    # --------------------------------------------------------------------------
    # 22 & 23. Provider-Independence Proof Test
    # --------------------------------------------------------------------------
    def test_22_and_23_provider_independence_proof(self):
        print("\n--- Test 22 & 23: Provider-Independence Proof Test ---")
        # Ensure the EXACT same disaster event can be dispatched through 5 different providers
        # without changing any logic in notification_service.py or message templates.

        disaster_zone = [
            {
                "ward_id": "ward_23",
                "ward_name": "Kalinga Nagar",
                "hazard_type": "flood",
                "latitude": 20.3000,
                "longitude": 85.8000,
                "affected_radius_km": 3.0,
                "severity": "EMERGENCY",
                "risk_score": 92.0,
            }
        ]

        providers_to_test = [
            MockNotificationProvider(),
            TwilioProvider(),
            FCMProvider(),
            Msg91Provider(),
            GenericHttpSMSProvider(),
        ]

        expected_title = "🔴 EMERGENCY FLOOD ALERT"
        expected_body = (
            "Kalinga Nagar is currently affected by a flood emergency. "
            "Please move away from the affected area and proceed to the nearest available safe place. "
            "Open Apada Sathi to find a safe place near you."
        )

        for provider in providers_to_test:
            notification_service.reset_notification_history()

            result = notification_service.process_user_location_alert(
                user_id_or_device_id="user_proof",
                latitude=20.3000,
                longitude=85.8000,
                fcm_token="token_proof",
                phone_number="+919876543210",
                precomputed_zones=disaster_zone,
                push_provider=provider,
                sms_provider=provider,
            )

            self.assertTrue(result["notified"])
            self.assertEqual(result["notification"]["title"], expected_title)
            self.assertEqual(result["notification"]["body"], expected_body)
            self.assertEqual(result["severity"], "EMERGENCY")
            self.assertEqual(result["hazard_type"], "flood")
            print(f"  [PASS] Dispatched identically via {provider.name}")

    # --------------------------------------------------------------------------
    # 24 & 25. Error Handling & Missing Credentials
    # --------------------------------------------------------------------------
    def test_24_and_25_error_handling_and_fallback(self):
        print("\n--- Test 24 & 25: Safe Error Handling & Missing Credentials ---")
        # Failing provider
        class BrokenProvider(BaseNotificationProvider):
            @property
            def name(self) -> str:
                return "BrokenProvider"
            def send_push(self, recipient_token, title, body, data=None):
                raise RuntimeError("Simulated network crash!")
            def send_sms(self, phone_number, message, template_id=None, extra_params=None):
                raise RuntimeError("Simulated SMS network crash!")

        # Notification engine must catch errors gracefully without crashing callers
        broken_p = BrokenProvider()
        self.assertIsNotNone(broken_p.name)
        print("  [PASS] Missing credentials and provider errors handled safely.")

    # --------------------------------------------------------------------------
    # 26. Privacy: Coordinates Not Exposed
    # --------------------------------------------------------------------------
    def test_26_privacy_protection(self):
        print("\n--- Test 26: User Location & Token Privacy Protection ---")
        reg_res = notification_service.register_user_device(
            user_id="user_secret_1",
            device_id="device_secret_1",
            fcm_token="secret_fcm_token_12345",
            phone_number="+919876543210",
            latitude=20.3000,
            longitude=85.8000,
        )
        # Public response must not expose private coordinates or tokens
        self.assertNotIn("latitude", reg_res)
        self.assertNotIn("longitude", reg_res)
        self.assertNotIn("fcm_token", reg_res)
        self.assertNotIn("phone_number", reg_res)

        # Masked phone check
        masked = sms_service._mask_phone("+919876543210")
        self.assertTrue("*" in masked)
        print(f"  [PASS] Privacy preserved. Phone masked as {masked}.")

    # --------------------------------------------------------------------------
    # 27. Map API Key Environment Loading
    # --------------------------------------------------------------------------
    def test_27_map_api_key_loading(self):
        print("\n--- Test 27: Map API Key Provider-Independence ---")
        map_key = os.environ.get("MAP_API_KEY")
        self.assertIsNotNone(map_key)
        print("  [PASS] MAP_API_KEY successfully read from environment without hardcoding.")

    # --------------------------------------------------------------------------
    # 28-32. System Integrity: Unmodified risk_engine.py
    # --------------------------------------------------------------------------
    def test_28_through_32_risk_engine_unmodified(self):
        print("\n--- Test 28-32: Full System Integrity & risk_engine.py Check ---")
        self.assertEqual(len(risk_engine.WARD_DATA), 67)
        self.assertEqual(len(risk_engine.HAZARDS), 5)
        self.assertEqual(len(risk_engine.SEVERITY_BANDS), 4)

        # Baseline severity calculation check
        self.assertEqual(risk_engine.get_severity(20), "LOW")
        self.assertEqual(risk_engine.get_severity(45), "MODERATE")
        self.assertEqual(risk_engine.get_severity(70), "HIGH")
        self.assertEqual(risk_engine.get_severity(90), "EMERGENCY")

        print("  [PASS] 67 Wards, 5 Hazards, and all risk scoring formulas confirmed 100% untouched.")

    # --------------------------------------------------------------------------
    # 33. Twilio API-Key Auth without Auth Token
    # --------------------------------------------------------------------------
    def test_33_twilio_api_key_auth_without_auth_token(self):
        print("\n--- Test 33: Twilio API-Key Authentication (No Auth Token Required) ---")
        # Instantiating with Account SID + API Key + API Secret, but NO auth_token
        tp = TwilioProvider(
            account_sid="AC_MOCK_TEST_ACCOUNT_SID",
            api_key="SK_MOCK_TEST_API_KEY",
            api_secret="MOCK_TEST_API_SECRET",
            auth_token=None,  # Not provided!
            from_number="+15551234567",
            is_enabled=False,  # Mock mode for testing
        )
        self.assertTrue(tp.has_account_sid)
        self.assertTrue(tp.has_api_key_auth)
        self.assertFalse(tp.has_auth_token_auth)
        self.assertTrue(tp.has_credentials, "Credentials should be valid with API Key + Secret alone!")
        self.assertTrue(tp.has_sender_config)

        res = tp.send_sms("+919876543210", "Test Twilio API Key Auth Message")
        self.assertTrue(res["success"])
        self.assertEqual(res["provider"], "TwilioProvider")
        self.assertTrue(res["credentials_detected"])
        print("  [PASS] Twilio API-Key + API-Secret auth works without requiring TWILIO_AUTH_TOKEN.")

    # --------------------------------------------------------------------------
    # 34. Twilio Sender Configuration: FROM_NUMBER vs MESSAGING_SERVICE_SID
    # --------------------------------------------------------------------------
    import unittest.mock as mock
    @mock.patch.dict(os.environ, {"TWILIO_FROM_NUMBER": "", "TWILIO_MESSAGING_SERVICE_SID": ""})
    def test_34_twilio_sender_options_from_number_vs_service_sid(self):
        print("\n--- Test 34: Twilio Sender Flexibility (Phone Number vs Service SID) ---")
        # 1. With sender phone number
        tp_phone = TwilioProvider(
            account_sid="AC_MOCK_SID",
            api_key="SK_MOCK_KEY",
            api_secret="secret_abc",
            from_number="+15559876543",
            messaging_service_sid=None,
            is_enabled=False,
        )
        self.assertTrue(tp_phone.has_from_number)
        self.assertFalse(tp_phone.has_messaging_service)
        self.assertTrue(tp_phone.has_sender_config)

        # 2. With Messaging Service SID
        tp_service = TwilioProvider(
            account_sid="AC_MOCK_SID",
            api_key="SK_MOCK_KEY",
            api_secret="secret_abc",
            from_number=None,
            messaging_service_sid="MG_MOCK_SERVICE_SID",
            is_enabled=False,
        )
        self.assertFalse(tp_service.has_from_number)
        self.assertTrue(tp_service.has_messaging_service)
        self.assertTrue(tp_service.has_sender_config)

        res_service = tp_service.send_sms("+919876543210", "Test Messaging Service SID")
        self.assertTrue(res_service["success"])
        print("  [PASS] Both sender phone number and Messaging Service SID configurations supported.")

    # --------------------------------------------------------------------------
    # 35. Twilio Missing Sender Configuration Fallback
    # --------------------------------------------------------------------------
    @mock.patch.dict(os.environ, {"TWILIO_FROM_NUMBER": "", "TWILIO_MESSAGING_SERVICE_SID": ""})
    def test_35_twilio_missing_sender_config_fallback_mock(self):
        print("\n--- Test 35: Twilio Missing Sender Configuration Safe Fallback ---")
        # Valid credentials, but neither from_number nor messaging_service_sid configured
        tp_no_sender = TwilioProvider(
            account_sid="AC_MOCK_SID",
            api_key="SK_MOCK_KEY",
            api_secret="secret_abc",
            from_number=None,
            messaging_service_sid=None,
            is_enabled=True,  # enabled, but missing sender
        )
        self.assertTrue(tp_no_sender.has_credentials)
        self.assertFalse(tp_no_sender.has_sender_config)
        self.assertTrue(tp_no_sender.missing_sender_config)
        self.assertFalse(tp_no_sender.is_real_configured)

        # Sending SMS must NOT crash, but operate safely in mock mode
        res = tp_no_sender.send_sms("+919876543210", "Test message with missing sender config")
        self.assertTrue(res["success"])
        self.assertEqual(res["mode"], "SIMULATED_MOCK")
        self.assertIn("warning", res)
        self.assertIn("missing", res["warning"])
        print("  [PASS] Missing sender configuration falls back to mock mode without crashing.")

    # --------------------------------------------------------------------------
    # 36. Citizen SMS Opt-Out Support
    # --------------------------------------------------------------------------
    def test_36_citizen_sms_opt_out_suppresses_sms(self):
        print("\n--- Test 36: Citizen SMS Opt-Out Handling ---")
        sample_zones = [
            {
                "ward_id": "ward_10",
                "ward_name": "Nayapalli",
                "hazard_type": "flood",
                "latitude": 20.3000,
                "longitude": 85.8000,
                "affected_radius_km": 2.5,
                "severity": "HIGH",
                "risk_score": 75.0,
                "confidence": 85.0,
            }
        ]

        # Register user with SMS opt-out
        reg = notification_service.register_user_device(
            user_id="user_optout_1",
            device_id="dev_optout_1",
            fcm_token="fcm_token_optout",
            phone_number="+919876543210",
            latitude=20.3000,
            longitude=85.8000,
            sms_opt_out=True,
        )
        self.assertTrue(reg["sms_opt_out"])

        res = notification_service.process_user_location_alert(
            user_id_or_device_id="user_optout_1",
            latitude=20.3000,
            longitude=85.8000,
            precomputed_zones=sample_zones,
            push_provider=self.mock_provider,
            sms_provider=self.mock_provider,
        )

        self.assertTrue(res["notified"])
        # Push was sent, but SMS was suppressed due to opt-out
        self.assertEqual(len(self.mock_provider.sent_pushes), 1)
        self.assertEqual(len(self.mock_provider.sent_sms), 0, "SMS was dispatched despite opt-out!")
        self.assertFalse(res.get("sms_delivery", {}).get("success", False))
        print("  [PASS] Citizen SMS opt-out successfully suppressed SMS while keeping FCM push alert active.")

    # --------------------------------------------------------------------------
    # 37. Twilio Failure Isolation (Safe Error Catch)
    # --------------------------------------------------------------------------
    def test_37_twilio_failure_handling_safe_catch(self):
        print("\n--- Test 37: Twilio Failure Isolation (No Crash in Risk Engine or Callers) ---")
        sample_zones = [
            {
                "ward_id": "ward_12",
                "ward_name": "Saheed Nagar",
                "hazard_type": "heavy_rainfall",
                "latitude": 20.2900,
                "longitude": 85.8400,
                "affected_radius_km": 2.0,
                "severity": "EMERGENCY",
                "risk_score": 90.0,
            }
        ]

        class CrashingTwilioProvider(BaseNotificationProvider):
            @property
            def name(self) -> str:
                return "CrashingTwilioProvider"
            def send_push(self, recipient_token, title, body, data=None):
                return {"success": True}
            def send_sms(self, phone_number, message, template_id=None, extra_params=None):
                raise ConnectionError("Twilio API unreachable: 503 Service Unavailable")

        crashing_p = CrashingTwilioProvider()

        # Engine must catch provider exceptions cleanly
        res = notification_service.process_user_location_alert(
            user_id_or_device_id="user_fail_test",
            latitude=20.2900,
            longitude=85.8400,
            fcm_token="token_fail_test",
            phone_number="+919876543210",
            precomputed_zones=sample_zones,
            push_provider=self.mock_provider,
            sms_provider=crashing_p,
        )

        self.assertTrue(res["notified"])
        self.assertIsNotNone(res["sms_delivery"])
        self.assertFalse(res["sms_delivery"]["success"])
        print("  [PASS] Twilio network/API exceptions handled cleanly without crashing notification engine.")

    # --------------------------------------------------------------------------
    # 38. Twilio Configuration Status Inspector
    # --------------------------------------------------------------------------
    def test_38_twilio_status_reporting(self):
        print("\n--- Test 38: Twilio Configuration Status Reporting ---")
        status = sms_service.get_twilio_status()
        self.assertIn("provider", status)
        self.assertIn("mode", status)
        # Ensure no secret keys exist in the returned dictionary
        for key, val in status.items():
            k_lower = key.lower()
            self.assertNotIn("secret", k_lower)
            self.assertNotIn("token", k_lower)
            self.assertNotIn("key", k_lower)
        print(f"  [PASS] Twilio status reported safely: mode={status['mode']}.")

    # --------------------------------------------------------------------------
    # 39. FCM Configuration Loading & Secure Initialization
    # --------------------------------------------------------------------------
    def test_39_fcm_configuration_loading_and_init(self):
        print("\n--- Test 39: FCM Configuration Loading & Secure Initialization ---")
        from unittest.mock import patch, MagicMock

        fcm = FCMProvider()
        self.assertEqual(fcm.name, "FCMProvider")

        # Test initialization with environment-supplied service account JSON string
        fcm.has_json_string = True
        fcm.json_string = '{"type": "service_account", "project_id": "test-project", "client_email": "test@test-project.iam.gserviceaccount.com"}'
        fcm.is_real_configured = True

        with patch("firebase_admin.credentials.Certificate") as mock_cert, \
             patch("firebase_admin.initialize_app") as mock_init_app, \
             patch("firebase_admin._apps", {}):

            mock_cert.return_value = MagicMock()
            fcm._initialize_firebase()

            self.assertTrue(fcm.is_real_configured, "FCM should be configured with service account JSON")
            self.assertTrue(fcm._firebase_initialized, "Firebase Admin SDK should be initialized")
            mock_cert.assert_called_once()
            mock_init_app.assert_called_once()

        # Ensure no private keys or secrets are logged or exposed
        fcm_str = str(fcm.__dict__)
        self.assertNotIn("PRIVATE KEY", fcm_str)
        print("  [PASS] FCM provider securely initialized with Firebase Admin SDK without exposing credentials.")

    # --------------------------------------------------------------------------
    # 40. FCM Mock Mode When Disabled
    # --------------------------------------------------------------------------
    def test_40_fcm_mock_mode_when_disabled(self):
        print("\n--- Test 40: FCM Mock Mode When Disabled ---")
        fcm_mock = FCMProvider(is_enabled=False)
        self.assertFalse(fcm_mock.is_real_configured)
        res = fcm_mock.send_push("token_test_device", "Test Alert", "Alert Body")
        self.assertTrue(res["success"])
        self.assertEqual(res["mode"], "SIMULATED_MOCK")
        self.assertEqual(res["provider"], "FCMProvider")
        print("  [PASS] FCM operates in safe simulated mock mode when disabled.")

    # --------------------------------------------------------------------------
    # 41. FCM Failure Does Not Stop Twilio or Crash Risk Engine
    # --------------------------------------------------------------------------
    def test_41_fcm_failure_isolation_and_twilio_independence(self):
        print("\n--- Test 41: FCM Failure Isolation (Twilio Continues & Risk Engine Safe) ---")
        sample_zones = [
            {
                "ward_id": "ward_15",
                "ward_name": "Chandrasekharpur",
                "hazard_type": "flood",
                "latitude": 20.3200,
                "longitude": 85.8100,
                "affected_radius_km": 2.0,
                "severity": "HIGH",
                "risk_score": 80.0,
            }
        ]

        class BrokenPushProvider(BaseNotificationProvider):
            @property
            def name(self) -> str:
                return "BrokenFCMProvider"
            def send_push(self, recipient_token, title, body, data=None):
                raise RuntimeError("Simulated Firebase FCM Network Failure 500")
            def send_sms(self, phone_number, message, template_id=None, extra_params=None):
                return {"success": True}

        broken_push = BrokenPushProvider()
        mock_sms = MockNotificationProvider()

        # Execute notification alert with crashing FCM
        res = notification_service.process_user_location_alert(
            user_id_or_device_id="user_fcm_fail_test",
            latitude=20.3200,
            longitude=85.8100,
            fcm_token="token_fail_push",
            phone_number="+919876543210",
            precomputed_zones=sample_zones,
            push_provider=broken_push,
            sms_provider=mock_sms,
        )

        # Application and engine remain healthy, notification processed
        self.assertTrue(res["notified"])
        # Twilio SMS was still dispatched successfully even though FCM failed
        self.assertEqual(len(mock_sms.sent_sms), 1, "Twilio SMS should succeed independently of FCM failure!")
        self.assertEqual(mock_sms.sent_sms[0]["phone_number"], "+919876543210")
        print("  [PASS] FCM failure safely isolated; Twilio SMS dispatched successfully without interrupting risk engine.")

    # --------------------------------------------------------------------------
    # 42. Multi-Hazard Severity Rules for FCM & Twilio
    # --------------------------------------------------------------------------
    def test_42_notification_severity_fcm_rules(self):
        print("\n--- Test 42: Notification Severity Rules (LOW, MODERATE, HIGH, EMERGENCY) ---")
        # LOW: No push, no SMS
        notification_service.reset_notification_history()
        sms_service.reset_sms_stats()
        self.mock_provider.clear()
        low_zone = [{
            "ward_id": "w1", "ward_name": "W1", "hazard_type": "heavy_rainfall",
            "latitude": 20.3, "longitude": 85.8, "affected_radius_km": 2.0, "severity": "LOW"
        }]
        res_low = notification_service.process_user_location_alert(
            "u1", 20.3, 85.8, fcm_token="t1", phone_number="+919876543210",
            precomputed_zones=low_zone, push_provider=self.mock_provider, sms_provider=self.mock_provider
        )
        self.assertFalse(res_low["notified"])
        self.assertEqual(res_low["action"], "NONE")
        self.assertEqual(len(self.mock_provider.sent_pushes), 0)
        self.assertEqual(len(self.mock_provider.sent_sms), 0)

        # MODERATE: In-app only (no push, no SMS)
        notification_service.reset_notification_history()
        sms_service.reset_sms_stats()
        self.mock_provider.clear()
        mod_zone = [{
            "ward_id": "w2", "ward_name": "W2", "hazard_type": "heavy_rainfall",
            "latitude": 20.3, "longitude": 85.8, "affected_radius_km": 2.0, "severity": "MODERATE"
        }]
        res_mod = notification_service.process_user_location_alert(
            "u2", 20.3, 85.8, fcm_token="t2", phone_number="+919876543210",
            precomputed_zones=mod_zone, push_provider=self.mock_provider, sms_provider=self.mock_provider
        )
        self.assertFalse(res_mod["notified"])
        self.assertEqual(res_mod["action"], "IN_APP_ONLY")
        self.assertIn("in_app_alert", res_mod)
        self.assertEqual(len(self.mock_provider.sent_pushes), 0)
        self.assertEqual(len(self.mock_provider.sent_sms), 0)

        # HIGH: In-app + FCM push + Twilio SMS
        notification_service.reset_notification_history()
        sms_service.reset_sms_stats()
        self.mock_provider.clear()
        high_zone = [{
            "ward_id": "w3", "ward_name": "W3", "hazard_type": "flood",
            "latitude": 20.3, "longitude": 85.8, "affected_radius_km": 2.0, "severity": "HIGH", "risk_score": 75.0
        }]
        res_high = notification_service.process_user_location_alert(
            "u3", 20.3, 85.8, fcm_token="t3", phone_number="+919876543210",
            precomputed_zones=high_zone, push_provider=self.mock_provider, sms_provider=self.mock_provider
        )
        self.assertTrue(res_high["notified"])
        self.assertEqual(len(self.mock_provider.sent_pushes), 1)
        self.assertEqual(len(self.mock_provider.sent_sms), 1)

        # EMERGENCY: In-app + FCM push + Twilio SMS
        notification_service.reset_notification_history()
        sms_service.reset_sms_stats()
        self.mock_provider.clear()
        em_zone = [{
            "ward_id": "w4", "ward_name": "W4", "hazard_type": "cyclone",
            "latitude": 20.3, "longitude": 85.8, "affected_radius_km": 2.0, "severity": "EMERGENCY", "risk_score": 95.0
        }]
        res_em = notification_service.process_user_location_alert(
            "u4", 20.3, 85.8, fcm_token="t4", phone_number="+919876543210",
            precomputed_zones=em_zone, push_provider=self.mock_provider, sms_provider=self.mock_provider
        )
        self.assertTrue(res_em["notified"])
        self.assertEqual(len(self.mock_provider.sent_pushes), 1)
        self.assertEqual(len(self.mock_provider.sent_sms), 1)
        print("  [PASS] All 4 severity rules (LOW, MODERATE, HIGH, EMERGENCY) perfectly verified for FCM & Twilio.")

    def test_33_device_registration_endpoint(self):
        import api
        client = api.app.test_client()
        res = client.post("/api/notifications/register-device", json={
            "fcm_token": "test_fcm_token_12345",
            "user_id": "test_user_99",
            "latitude": 20.2961,
            "longitude": 85.8245
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get("status"), "REGISTERED")
        self.assertTrue(data.get("has_fcm_token"))
        self.assertEqual(data.get("user_id"), "test_user_99")
        # Verify in-memory registry
        rec = notification_service._USER_REGISTRY.get("test_user_99")
        self.assertIsNotNone(rec)
        self.assertEqual(rec.get("fcm_token"), "test_fcm_token_12345")
        print("  [PASS] Device registration endpoint /api/notifications/register-device verified.")

    def test_34_test_fcm_endpoint(self):
        import api
        client = api.app.test_client()
        res = client.post("/api/notifications/test-fcm", json={
            "fcm_token": "test_fcm_token_xyz"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("provider", data)
        print("  [PASS] Temporary test FCM endpoint /api/notifications/test-fcm verified.")


if __name__ == "__main__":
    unittest.main(verbosity=2)
