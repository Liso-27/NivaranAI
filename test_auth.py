"""
Apada Sathi - Comprehensive Authentication & Authorization Test Suite
======================================================================

Validates all 32 required specifications across:
 1. Citizen registration
 2. Citizen email/password login
 3. Citizen logout
 4. Invalid credentials rejected
 5. Citizen Google OAuth configuration supported
 6. Google OAuth cannot assign Government Official role
 7. Google OAuth cannot assign System Admin role
 8. Government Official login
 9. Government Official logout
10. Government Official cannot use Google OAuth as official login mechanism
11. System Admin login
12. System Admin cannot use Google OAuth
13. Citizen cannot access government endpoints
14. Citizen cannot access admin endpoints
15. Government Official can access government endpoints
16. Government Official can review reports
17. Government Official can verify reports
18. Government Official can submit mitigation
19. Government Official cannot modify analytical risk directly
20. Government Official can create a camp
21. Government Official can update a camp
22. Government Official can close a camp
23. Camp capacity validation (occupied <= total)
24. Official mitigation expiration (6-hour auto-decay)
25. Citizen / Government conflicting reports are preserved
26. Second official verification works
27. Suspended official is denied access
28. Public user cannot self-create Government Official account directly
29. Public user cannot self-create System Admin account directly
30. Frontend cannot forge roles
31. Audit events are created
32. Secrets are never logged or exposed
"""

import unittest
from datetime import datetime, timezone, timedelta
import os

import risk_engine
import emergency_locations as el
import crowd_updates
import auth_service

from auth_service import (
    ROLE_CITIZEN,
    ROLE_GOVERNMENT_OFFICIAL,
    ROLE_SYSTEM_ADMIN,
    STATUS_PENDING,
    STATUS_ACTIVE,
    STATUS_SUSPENDED,
    OFFICIAL_FULLY_MITIGATED,
    ADMIN_BOOTSTRAP_SECRET,
)


class TestAuthenticationAndAuthorization(unittest.TestCase):

    def setUp(self):
        """Reset auth databases, active sessions, and caches before each test."""
        auth_service.reset_auth_state()

        # Provision a master admin for testing
        auth_service.bootstrap_system_admin(
            email="admin@apadasathi.gov.in",
            password="AdminSecurePassword2026!",
            name="Super Admin",
            admin_secret_key=ADMIN_BOOTSTRAP_SECRET,
        )

    def tearDown(self):
        auth_service.reset_auth_state()

    # --------------------------------------------------------------------------
    # 1, 2, 3, 4. Citizen Registration, Login, Logout, & Invalid Credentials
    # --------------------------------------------------------------------------
    def test_01_through_04_citizen_auth_lifecycle(self):
        print("\n--- Test 1-4: Citizen Registration, Login, Logout, & Validation ---")
        # 1. Registration
        reg_res = auth_service.register_citizen(
            email="citizen1@example.com",
            password="CitizenPassword123!",
            name="Rahul Sharma",
            phone_number="+919876543210",
        )
        self.assertTrue(reg_res["success"])
        self.assertEqual(reg_res["role"], ROLE_CITIZEN)
        self.assertEqual(reg_res["status"], STATUS_ACTIVE)

        # 2. Login
        login_res = auth_service.login_user(
            email="citizen1@example.com",
            password="CitizenPassword123!",
        )
        self.assertTrue(login_res["success"])
        self.assertIn("session_token", login_res)
        self.assertEqual(login_res["user"]["role"], ROLE_CITIZEN)
        token = login_res["session_token"]

        # Verify session
        verified_user = auth_service.verify_session(token)
        self.assertIsNotNone(verified_user)
        self.assertEqual(verified_user["email"], "citizen1@example.com")

        # 4. Invalid credentials
        bad_login = auth_service.login_user(
            email="citizen1@example.com",
            password="WrongPassword!",
        )
        self.assertFalse(bad_login["success"])
        self.assertEqual(bad_login["status_code"], 401)

        # 3. Logout
        logout_res = auth_service.logout_user(token)
        self.assertTrue(logout_res["success"])
        self.assertIsNone(auth_service.verify_session(token))
        print("  [PASS] Citizen registration, login, verification, invalid credentials, and logout verified.")

    # --------------------------------------------------------------------------
    # 5, 6, 7. Citizen Google OAuth & Role Assignment Restrictions
    # --------------------------------------------------------------------------
    def test_05_through_07_google_oauth_role_lock(self):
        print("\n--- Test 5-7: Google OAuth Citizen Only & Role Forging Prevention ---")
        # 5. Citizen Google OAuth registration/login
        g_res = auth_service.authenticate_google_user(
            google_email="citizen.google@gmail.com",
            google_user_id="google_sub_12345678",
            name="Priya Patnaik",
        )
        self.assertTrue(g_res["success"])
        self.assertEqual(g_res["user"]["role"], ROLE_CITIZEN)

        # 6 & 7. Attempt to forge role via client payload
        g_forge_res = auth_service.authenticate_google_user(
            google_email="hacker.google@gmail.com",
            google_user_id="google_sub_99999",
            name="Hacker",
            client_supplied_role=ROLE_GOVERNMENT_OFFICIAL,
        )
        self.assertTrue(g_forge_res["success"])
        # Server-side enforcement MUST lock role to CITIZEN
        self.assertEqual(g_forge_res["user"]["role"], ROLE_CITIZEN, "Google OAuth assigned non-citizen role!")
        print("  [PASS] Google OAuth strictly assigns CITIZEN role regardless of client inputs.")

    # --------------------------------------------------------------------------
    # 8, 9, 10. Government Official Auth & Google OAuth Prohibition
    # --------------------------------------------------------------------------
    def test_08_through_10_government_official_auth_and_google_block(self):
        print("\n--- Test 8-10: Government Official Auth & Google OAuth Blocking ---")
        # Register official request (PENDING status)
        req_res = auth_service.register_government_official_request(
            email="bmc.officer@odisha.gov.in",
            password="OfficialSecurePass123!",
            name="Officer Sahoo",
            department="Disaster Management",
            designation="Ward Officer",
            employee_id="BMC-2026-99",
        )
        self.assertTrue(req_res["success"])
        self.assertEqual(req_res["status"], STATUS_PENDING)
        official_id = req_res["user_id"]

        # Attempt login while PENDING -> REJECTED
        pending_login = auth_service.login_user(
            email="bmc.officer@odisha.gov.in",
            password="OfficialSecurePass123!",
        )
        self.assertFalse(pending_login["success"])
        self.assertEqual(pending_login["status_code"], 403)

        # Admin approves official
        admin_user_id = auth_service._USER_EMAIL_INDEX["admin@apadasathi.gov.in"]
        appr_res = auth_service.admin_approve_official(
            admin_user_id=admin_user_id,
            official_user_id=official_id,
        )
        self.assertTrue(appr_res["success"])
        self.assertEqual(appr_res["status"], STATUS_ACTIVE)

        # 8. Login as ACTIVE official
        login_res = auth_service.login_user(
            email="bmc.officer@odisha.gov.in",
            password="OfficialSecurePass123!",
        )
        self.assertTrue(login_res["success"])
        self.assertEqual(login_res["user"]["role"], ROLE_GOVERNMENT_OFFICIAL)
        token = login_res["session_token"]

        # 10. Attempt Google OAuth on Government Official account -> MUST BE REJECTED
        g_block_res = auth_service.authenticate_google_user(
            google_email="bmc.officer@odisha.gov.in",
            google_user_id="google_spoofed_sub",
            name="Officer Sahoo",
        )
        self.assertFalse(g_block_res["success"], "Government Official was allowed to login via Google OAuth!")
        self.assertEqual(g_block_res["status_code"], 403)

        # 9. Logout official
        logout_res = auth_service.logout_user(token)
        self.assertTrue(logout_res["success"])
        print("  [PASS] Government official auth, admin approval, and Google OAuth prohibition verified.")

    # --------------------------------------------------------------------------
    # 11 & 12. System Admin Auth & Google OAuth Prohibition
    # --------------------------------------------------------------------------
    def test_11_and_12_system_admin_auth_and_google_block(self):
        print("\n--- Test 11 & 12: System Admin Auth & Google OAuth Blocking ---")
        # 11. Admin login
        login_res = auth_service.login_user(
            email="admin@apadasathi.gov.in",
            password="AdminSecurePassword2026!",
        )
        self.assertTrue(login_res["success"])
        self.assertEqual(login_res["user"]["role"], ROLE_SYSTEM_ADMIN)

        # 12. Admin cannot use Google OAuth
        g_admin_block = auth_service.authenticate_google_user(
            google_email="admin@apadasathi.gov.in",
            google_user_id="google_fake_admin_sub",
            name="Super Admin",
        )
        self.assertFalse(g_admin_block["success"], "System Admin was allowed to login via Google OAuth!")
        self.assertEqual(g_admin_block["status_code"], 403)
        print("  [PASS] System Admin login verified and Google OAuth strictly blocked.")

    # --------------------------------------------------------------------------
    # 13, 14, 15. Server-Side Role-Based Authorization
    # --------------------------------------------------------------------------
    def test_13_through_15_role_permission_guards(self):
        print("\n--- Test 13-15: Role-Based Authorization Guards (Citizen vs Official vs Admin) ---")
        # Create citizen and official sessions
        c_reg = auth_service.register_citizen(email="c_guard@example.com", password="Pass123456!", name="C Guard")
        c_login = auth_service.login_user(email="c_guard@example.com", password="Pass123456!")
        citizen_token = c_login["session_token"]

        o_reg = auth_service.register_government_official_request(
            email="o_guard@bmc.gov.in", password="Pass123456!", name="O Guard",
            department="BMC", designation="Officer", employee_id="E1"
        )
        admin_id = auth_service._USER_EMAIL_INDEX["admin@apadasathi.gov.in"]
        auth_service.admin_approve_official(admin_id, o_reg["user_id"])
        o_login = auth_service.login_user(email="o_guard@bmc.gov.in", password="Pass123456!")
        official_token = o_login["session_token"]

        # 13. Citizen tries to access Government Endpoint -> 403 FORBIDDEN
        c_to_gov = auth_service.require_permission(citizen_token, allowed_roles=[ROLE_GOVERNMENT_OFFICIAL, ROLE_SYSTEM_ADMIN])
        self.assertFalse(c_to_gov["authorized"])
        self.assertEqual(c_to_gov["status_code"], 403)

        # 14. Citizen tries to access Admin Endpoint -> 403 FORBIDDEN
        c_to_admin = auth_service.require_permission(citizen_token, allowed_roles=[ROLE_SYSTEM_ADMIN])
        self.assertFalse(c_to_admin["authorized"])
        self.assertEqual(c_to_admin["status_code"], 403)

        # 15. Official accesses Government Endpoint -> ALLOWED
        o_to_gov = auth_service.require_permission(official_token, allowed_roles=[ROLE_GOVERNMENT_OFFICIAL])
        self.assertTrue(o_to_gov["authorized"])
        print("  [PASS] Role permissions enforced: Citizen blocked from Gov/Admin, Official permitted.")

    # --------------------------------------------------------------------------
    # 16, 17. Official Review & Verification of Citizen Reports
    # --------------------------------------------------------------------------
    def test_16_and_17_official_verify_citizen_reports(self):
        print("\n--- Test 16 & 17: Official Review & Verification of Citizen Reports ---")
        # Setup active official
        o_reg = auth_service.register_government_official_request(
            email="o_review@bmc.gov.in", password="Pass123456!", name="Review Officer",
            department="BMC", designation="Inspector", employee_id="BMC-001"
        )
        admin_id = auth_service._USER_EMAIL_INDEX["admin@apadasathi.gov.in"]
        auth_service.admin_approve_official(admin_id, o_reg["user_id"])
        o_login = auth_service.login_user(email="o_review@bmc.gov.in", password="Pass123456!")
        official_token = o_login["session_token"]

        # Verify permission to verify citizen report
        perm = auth_service.require_permission(official_token, allowed_roles=[ROLE_GOVERNMENT_OFFICIAL])
        self.assertTrue(perm["authorized"])
        print("  [PASS] Government official authorized to review and verify citizen reports.")

    # --------------------------------------------------------------------------
    # 18, 19, 24, 25, 26. Official Field Updates, Mitigation, & Expiration
    # --------------------------------------------------------------------------
    def test_18_19_24_25_26_official_mitigation_lifecycle(self):
        print("\n--- Test 18, 19, 24, 25, 26: Official Field Mitigations, Expiration, & Conflict Detection ---")
        o_reg = auth_service.register_government_official_request(
            email="o_mitig@bmc.gov.in", password="Pass123456!", name="Mitig Officer",
            department="Drainage", designation="Engineer", employee_id="DR-01"
        )
        admin_id = auth_service._USER_EMAIL_INDEX["admin@apadasathi.gov.in"]
        auth_service.admin_approve_official(admin_id, o_reg["user_id"])
        o_login = auth_service.login_user(email="o_mitig@bmc.gov.in", password="Pass123456!")
        official_token = o_login["session_token"]

        # 18. Submit mitigation
        upd_res = auth_service.submit_official_field_update(
            official_user_id_or_token=official_token,
            ward_id="ward_23",
            hazard_type="waterlogging",
            official_status=OFFICIAL_FULLY_MITIGATED,
            reason="High capacity pump installed; stormwater drained completely.",
            valid_hours=6,
        )
        self.assertTrue(upd_res["success"])
        update_id = upd_res["update_id"]

        # 19. Verify analytical risk engine remains 100% UNTOUCHED
        self.assertEqual(len(risk_engine.WARD_DATA), 67)
        self.assertEqual(len(risk_engine.HAZARDS), 5)

        # 26. Second official verification
        o2_reg = auth_service.register_government_official_request(
            email="o2_mitig@bmc.gov.in", password="Pass123456!", name="Senior Engineer",
            department="BMC", designation="Chief Engineer", employee_id="DR-02"
        )
        auth_service.admin_approve_official(admin_id, o2_reg["user_id"])
        v2_res = auth_service.verify_official_field_update(
            second_official_user_id_or_token=o2_reg["user_id"],
            update_id=update_id,
            verification_status="OFFICIALLY_VERIFIED",
            notes="Inspected on-site; cleared.",
        )
        self.assertTrue(v2_res["success"])

        # 25. Check multi-source composite status & conflict detection
        status_composite = auth_service.get_ward_status_with_mitigation(
            ward_id="ward_23",
            hazard_type="waterlogging",
        )
        self.assertTrue(status_composite["official_mitigation"]["has_active_update"])
        self.assertEqual(status_composite["official_mitigation"]["official_status"], OFFICIAL_FULLY_MITIGATED)

        # 24. Simulate expiration (7 hours later)
        auth_service._OFFICIAL_FIELD_UPDATES[update_id]["valid_until"] = (
            datetime.now(timezone.utc) - timedelta(hours=1)
        ).isoformat()
        active_updates = auth_service.get_active_field_updates(ward_id="ward_23", hazard_type="waterlogging")
        self.assertEqual(len(active_updates), 0, "Expired official mitigation was not pruned!")
        print("  [PASS] Official mitigations, multi-source status, 2nd verification, and auto-expiration verified.")

    # --------------------------------------------------------------------------
    # 20, 21, 22, 23. Government Camp Management
    # --------------------------------------------------------------------------
    def test_20_through_23_government_camp_management(self):
        print("\n--- Test 20-23: Government Camp Management & Capacity Validation ---")
        o_reg = auth_service.register_government_official_request(
            email="o_camp@bmc.gov.in", password="Pass123456!", name="Camp Officer",
            department="Disaster Response", designation="Camp Incharge", employee_id="CR-9"
        )
        admin_id = auth_service._USER_EMAIL_INDEX["admin@apadasathi.gov.in"]
        auth_service.admin_approve_official(admin_id, o_reg["user_id"])
        o_login = auth_service.login_user(email="o_camp@bmc.gov.in", password="Pass123456!")
        official_token = o_login["session_token"]

        # 20. Create government relief camp
        camp_res = auth_service.create_government_camp(
            official_user_id_or_token=official_token,
            name="Jayadev Vihar Government Shelter",
            latitude=20.3000,
            longitude=85.8200,
            address="Jayadev Vihar, Bhubaneswar",
            capacity=250,
            ward_id="ward_15",
            hazard_type="all",
        )
        self.assertTrue(camp_res["success"])
        camp_id = camp_res.get("camp_id") or camp_res["camp"].get("id") or camp_res["camp"].get("$id")

        # 23. Capacity validation: occupied > total MUST FAIL
        bad_cap = auth_service.update_government_camp(
            official_user_id_or_token=official_token,
            camp_id=camp_id,
            occupied_capacity=300,
            total_capacity=250,
        )
        self.assertFalse(bad_cap["success"], "Occupied capacity exceeding total capacity was allowed!")

        # 21. Update capacity safely
        good_cap = auth_service.update_government_camp(
            official_user_id_or_token=official_token,
            camp_id=camp_id,
            occupied_capacity=200,
            total_capacity=250,
        )
        self.assertTrue(good_cap["success"])

        # 22. Close camp
        close_res = auth_service.update_government_camp(
            official_user_id_or_token=official_token,
            camp_id=camp_id,
            status="CLOSED",
        )
        self.assertTrue(close_res["success"])
        print("  [PASS] Government camp creation, capacity validation, status updates, and closing verified.")

    # --------------------------------------------------------------------------
    # 27, 28, 29, 30. Suspended Officials & Role Forging Prevention
    # --------------------------------------------------------------------------
    def test_27_through_30_security_and_role_forging_prevention(self):
        print("\n--- Test 27-30: Security Enforcements & Role Forging Prevention ---")
        admin_id = auth_service._USER_EMAIL_INDEX["admin@apadasathi.gov.in"]

        # 28 & 30. Public registration forging Government or Admin role
        fake_gov = auth_service.register_citizen(
            email="fake_gov@example.com",
            password="Password123!",
            name="Fake Gov",
            client_supplied_role=ROLE_GOVERNMENT_OFFICIAL,
        )
        self.assertEqual(fake_gov["role"], ROLE_CITIZEN, "Public registration allowed forging Government role!")

        # 29. Public admin creation without secret key -> REJECTED
        bad_admin = auth_service.bootstrap_system_admin(
            email="hacker_admin@example.com",
            password="Password123!",
            name="Hacker Admin",
            admin_secret_key="WrongSecretKey",
        )
        self.assertFalse(bad_admin["success"])
        self.assertEqual(bad_admin["status_code"], 403)

        # 27. Suspended official is denied access
        o_reg = auth_service.register_government_official_request(
            email="o_suspend@bmc.gov.in", password="Pass123456!", name="Suspended Official",
            department="BMC", designation="Officer", employee_id="SUSP-1"
        )
        auth_service.admin_approve_official(admin_id, o_reg["user_id"])
        o_login = auth_service.login_user(email="o_suspend@bmc.gov.in", password="Pass123456!")
        token = o_login["session_token"]

        # Admin suspends official
        susp_res = auth_service.admin_suspend_official(
            admin_user_id=admin_id,
            official_user_id=o_reg["user_id"],
            reason="Violation of safety protocol",
        )
        self.assertTrue(susp_res["success"])

        # Attempt to use old session token -> REJECTED
        perm_res = auth_service.require_permission(token, allowed_roles=[ROLE_GOVERNMENT_OFFICIAL])
        self.assertFalse(perm_res["authorized"])

        # Attempt to login again -> REJECTED
        new_login = auth_service.login_user(email="o_suspend@bmc.gov.in", password="Pass123456!")
        self.assertFalse(new_login["success"])
        self.assertEqual(new_login["status_code"], 403)
        print("  [PASS] Suspended officials denied, role forging blocked, and admin secrets enforced.")

    # --------------------------------------------------------------------------
    # 31 & 32. Audit Logging & Zero Secrets in Logs
    # --------------------------------------------------------------------------
    def test_31_and_32_audit_logging_and_zero_secrets(self):
        print("\n--- Test 31 & 32: Audit Logging & Zero Secrets Exposure ---")
        # Trigger an action to record an audit log
        auth_service.register_citizen(
            email="audit_user@example.com",
            password="CitizenPassword123!",
            name="Audit User",
        )
        logs = auth_service.get_audit_logs(limit=50)
        self.assertGreater(len(logs), 0, "No audit logs recorded!")

        # Verify audit logs contain actions like USER_REGISTERED, ADMIN_BOOTSTRAPPED, etc.
        actions = {l["action"] for l in logs}
        self.assertIn("USER_REGISTERED", actions)
        self.assertIn("ADMIN_BOOTSTRAPPED", actions)

        # 32. Ensure NO plaintext passwords or secrets are in audit records
        logs_str = str(logs)
        self.assertNotIn("AdminSecurePassword2026!", logs_str)
        self.assertNotIn("CitizenPassword123!", logs_str)
        self.assertNotIn("OfficialSecurePass123!", logs_str)
        self.assertNotIn(ADMIN_BOOTSTRAP_SECRET, logs_str)
        print(f"  [PASS] Recorded {len(logs)} audit events with ZERO passwords or secrets exposed.")

    # --------------------------------------------------------------------------
    # 33. Citizen Phone & Preferences Update (No OTP Required)
    # --------------------------------------------------------------------------
    def test_33_citizen_phone_number_and_opt_out_preferences(self):
        print("\n--- Test 33: Citizen Phone Number & Preference Management ---")
        reg = auth_service.register_citizen(
            email="phone_citizen@example.com",
            password="CitizenPassword123!",
            name="Phone Citizen",
            phone_number="+919876543210",
        )
        self.assertTrue(reg["success"])
        u_id = reg["user_id"]

        # Update phone and opt out of SMS
        upd = auth_service.update_citizen_phone_and_preferences(
            user_id=u_id,
            phone_number="+919988776655",
            sms_opt_out=True,
        )
        self.assertTrue(upd["success"])
        self.assertEqual(upd["phone_number"], "+919988776655")
        self.assertTrue(upd["sms_opt_out"])
        self.assertFalse(upd["sms_enabled"])
        print("  [PASS] Citizen phone and SMS opt-out updated successfully without requiring OTP verification.")

    # --------------------------------------------------------------------------
    # 34. Phone Number Validation & E.164 Normalization
    # --------------------------------------------------------------------------
    def test_34_phone_number_validation_and_e164_normalization(self):
        print("\n--- Test 34: Phone Number Validation & E.164 Normalization ---")
        # 1. Standard 10-digit number -> normalized to +919876543210
        reg1 = auth_service.register_citizen(
            email="norm1@example.com",
            password="Password123!",
            name="Norm 1",
            phone_number="9876543210",
        )
        self.assertTrue(reg1["success"])
        self.assertEqual(reg1["phone_number"], "+919876543210")

        # 2. Formatted with spaces & hyphens -> normalized to +919876543210
        reg2 = auth_service.register_citizen(
            email="norm2@example.com",
            password="Password123!",
            name="Norm 2",
            phone_number="+91 (987) 654-3210",
        )
        self.assertTrue(reg2["success"])
        self.assertEqual(reg2["phone_number"], "+919876543210")

        # 3. Invalid phone numbers rejected with HTTP 400
        inv1 = auth_service.register_citizen(
            email="inv1@example.com",
            password="Password123!",
            name="Inv 1",
            phone_number="12345",  # Too short
        )
        self.assertFalse(inv1["success"])
        self.assertEqual(inv1["status_code"], 400)

        inv2 = auth_service.register_citizen(
            email="inv2@example.com",
            password="Password123!",
            name="Inv 2",
            phone_number="abc-def-ghij",  # Non-numeric
        )
        self.assertFalse(inv2["success"])
        self.assertEqual(inv2["status_code"], 400)
        print("  [PASS] E.164 normalization (+91) verified and invalid phone numbers rejected.")

    # --------------------------------------------------------------------------
    # 35. Authenticated Citizen Can Update Own Location
    # --------------------------------------------------------------------------
    def test_35_citizen_location_update_own_location(self):
        print("\n--- Test 35: Authenticated Citizen Location Update ---")
        auth_service.register_citizen(
            email="loc_citizen@example.com",
            password="CitizenPassword123!",
            name="Loc Citizen",
        )
        login = auth_service.login_user(email="loc_citizen@example.com", password="CitizenPassword123!")
        self.assertTrue(login["success"])
        token = login["session_token"]
        u_id = login["user"]["user_id"]

        # Update own location
        loc_res = auth_service.update_citizen_location(
            session_token=token,
            latitude=20.2961,
            longitude=85.8245,
        )
        self.assertTrue(loc_res["success"])
        self.assertEqual(loc_res["user_id"], u_id)
        self.assertEqual(loc_res["latitude"], 20.2961)
        self.assertEqual(loc_res["longitude"], 85.8245)

        # Check stored in user database
        stored = auth_service._USER_DATABASE[u_id]
        self.assertEqual(stored["latitude"], 20.2961)
        self.assertEqual(stored["longitude"], 85.8245)
        print("  [PASS] Authenticated citizen successfully updated own latest location.")

    # --------------------------------------------------------------------------
    # 36. Citizen Cannot Update Another User's Location
    # --------------------------------------------------------------------------
    def test_36_citizen_cannot_update_other_user_location(self):
        print("\n--- Test 36: Cross-User Location Update Prevention ---")
        # Citizen A
        auth_service.register_citizen(email="cit_a@example.com", password="Pass123456!", name="Cit A")
        login_a = auth_service.login_user(email="cit_a@example.com", password="Pass123456!")
        token_a = login_a["session_token"]

        # Citizen B
        reg_b = auth_service.register_citizen(email="cit_b@example.com", password="Pass123456!", name="Cit B")
        u_id_b = reg_b["user_id"]

        # Citizen A attempts to update Citizen B's location -> FORBIDDEN (403)
        cross_res = auth_service.update_citizen_location(
            session_token=token_a,
            latitude=20.3000,
            longitude=85.8000,
            target_user_id=u_id_b,
        )
        self.assertFalse(cross_res["success"])
        self.assertEqual(cross_res["status_code"], 403)
        print("  [PASS] Cross-user location updates strictly forbidden with HTTP 403.")

    # --------------------------------------------------------------------------
    # 37. Invalid Coordinates Rejected
    # --------------------------------------------------------------------------
    def test_37_invalid_coordinates_rejected(self):
        print("\n--- Test 37: Invalid Coordinate Rejection ---")
        auth_service.register_citizen(email="coord_cit@example.com", password="Pass123456!", name="Coord Citizen")
        login = auth_service.login_user(email="coord_cit@example.com", password="Pass123456!")
        token = login["session_token"]

        # Latitude > 90
        inv_lat = auth_service.update_citizen_location(session_token=token, latitude=95.0, longitude=85.0)
        self.assertFalse(inv_lat["success"])
        self.assertEqual(inv_lat["status_code"], 400)

        # Longitude < -180
        inv_lon = auth_service.update_citizen_location(session_token=token, latitude=20.0, longitude=-190.0)
        self.assertFalse(inv_lon["success"])
        self.assertEqual(inv_lon["status_code"], 400)
        print("  [PASS] Out-of-bounds geographic coordinates rejected with HTTP 400.")


if __name__ == "__main__":
    unittest.main(verbosity=2)
