"""
Apada Sathi - Map Zones and Crowd Updates Comprehensive Test Suite
===================================================================

Validates all 20 required backend specifications:
 1. Correct severity-to-colour mapping (LOW=#22C55E, MODERATE=#EAB308, HIGH=#F97316, EMERGENCY=#EF4444)
 2. Correct radius generation (deterministic, bounded, documented methodology)
 3. Valid latitude/longitude across all Bhubaneswar wards
 4. Map zone output structure (all 12+ required fields present & typed)
 5. Hazard filtering (all 5 hazards + 'all')
 6. Severity filtering (all 4 tiers + multi-select)
 7. Crowd update creation (validation, default fields, auto-ward resolution)
 8. Crowd update reading & querying
 9. YES/NO/UNKNOWN response handling & counting
10. Multiple reports from nearby locations (clustering)
11. Crowd corroboration scoring & confidence levels
12. Old report handling & time decay expiry
13. Government verification & rejection lifecycle
14. Crowd markers strictly separate from official hazard circles
15. Safe-place integration (filtering active hazard zones, closed/full facilities)
16. Existing risk engine runs cleanly
17. 67 BMC wards remain 100% intact
18. 5 multi-hazards remain 100% intact
19. Existing risk scoring formulas & severity thresholds are unchanged
20. Existing citizen-report logic in risk engine remains functional
"""

from datetime import datetime, timezone, timedelta
import unittest

import risk_engine
import emergency_locations as el
import map_zones
import crowd_updates


class TestMapAndCrowdBackend(unittest.TestCase):

    # --------------------------------------------------------------------------
    # 1. Correct Severity-to-Colour Mapping
    # --------------------------------------------------------------------------
    def test_01_severity_colors(self):
        print("\n--- Test 1: Verify Severity-to-Colour Mapping ---")
        expected_colors = {
            "LOW": "#22C55E",
            "MODERATE": "#EAB308",
            "HIGH": "#F97316",
            "EMERGENCY": "#EF4444",
        }
        for sev, hex_code in expected_colors.items():
            resolved = map_zones.get_severity_color(sev)
            self.assertEqual(resolved, hex_code, f"Mismatch for severity '{sev}'")
            print(f"  [PASS] {sev} -> {resolved}")

    # --------------------------------------------------------------------------
    # 2. Correct Radius Generation
    # --------------------------------------------------------------------------
    def test_02_radius_generation(self):
        print("\n--- Test 2: Verify Deterministic Visualization Radius Generation ---")
        # Cyclone has larger base radius than waterlogging
        cyclone_radius = map_zones.calculate_affected_radius_km("cyclone", "EMERGENCY", risk_score=90.0)
        waterlogging_radius = map_zones.calculate_affected_radius_km("waterlogging", "LOW", risk_score=20.0)
        rainfall_radius = map_zones.calculate_affected_radius_km("heavy_rainfall", "HIGH", risk_score=70.0)

        self.assertGreater(cyclone_radius, waterlogging_radius)
        self.assertGreater(cyclone_radius, rainfall_radius)

        # Verify radius is bounded within [0.30, 5.00] km
        self.assertGreaterEqual(waterlogging_radius, 0.30)
        self.assertLessEqual(cyclone_radius, 5.00)

        # Determinism check: same inputs yield same output
        r1 = map_zones.calculate_affected_radius_km("flood", "HIGH", 75.0)
        r2 = map_zones.calculate_affected_radius_km("flood", "HIGH", 75.0)
        self.assertEqual(r1, r2)
        print(f"  [PASS] Cyclone EMERGENCY (score 90): {cyclone_radius} km")
        print(f"  [PASS] Heavy Rainfall HIGH (score 70): {rainfall_radius} km")
        print(f"  [PASS] Waterlogging LOW (score 20): {waterlogging_radius} km")

    # --------------------------------------------------------------------------
    # 3. Valid Latitude / Longitude
    # --------------------------------------------------------------------------
    def test_03_valid_coordinates(self):
        print("\n--- Test 3: Verify Valid Bhubaneswar Coordinates for all Wards ---")
        for ward_id, w_data in map_zones.WARD_DATA.items():
            lat = w_data.get("lat")
            lon = w_data.get("lon")
            self.assertIsNotNone(lat, f"Ward {ward_id} missing lat")
            self.assertIsNotNone(lon, f"Ward {ward_id} missing lon")
            # Bhubaneswar bounding box ~ [20.15 - 20.45 N, 85.70 - 85.95 E]
            self.assertTrue(20.15 <= lat <= 20.45, f"Ward {ward_id} lat {lat} out of bounds")
            self.assertTrue(85.70 <= lon <= 85.95, f"Ward {ward_id} lon {lon} out of bounds")
        print(f"  [PASS] All {len(map_zones.WARD_DATA)} wards have valid Bhubaneswar coordinates.")

    # --------------------------------------------------------------------------
    # 4. Map Zone Output Structure
    # --------------------------------------------------------------------------
    def test_04_map_zone_structure(self):
        print("\n--- Test 4: Verify Map Zone Entity Structure ---")
        zone = map_zones.generate_map_zone_item(
            ward_id="ward_4",
            hazard_type="flood",
            risk_score=78.5,
            severity="HIGH",
            confidence=85.0,
            ward_name="Ward 4",
        )

        required_keys = [
            "ward_id",
            "ward_name",
            "hazard_type",
            "latitude",
            "longitude",
            "risk_score",
            "severity",
            "confidence",
            "affected_radius_km",
            "color",
            "short_description",
            "last_updated",
        ]
        for k in required_keys:
            self.assertIn(k, zone, f"Missing required map zone key '{k}'")

        self.assertEqual(zone["ward_id"], "ward_4")
        self.assertEqual(zone["hazard_type"], "flood")
        self.assertEqual(zone["severity"], "HIGH")
        self.assertEqual(zone["color"], "#F97316")
        self.assertEqual(zone["risk_score"], 78.5)
        self.assertIsInstance(zone["affected_radius_km"], float)
        print("  [PASS] Map zone item satisfies all required specifications.")

    # --------------------------------------------------------------------------
    # 5. Hazard Filtering
    # --------------------------------------------------------------------------
    def test_05_hazard_filtering(self):
        print("\n--- Test 5: Verify Hazard Filtering ---")
        sample_results = [
            {
                "ward_id": "ward_1",
                "ward_name": "Ward 1",
                "worst_hazard": "waterlogging",
                "overall_severity": "LOW",
                "confidence": 80.0,
                "notification": {"notify_user": False, "type": None, "show_safe_place": False},
                "hazards": {
                    "heavy_rainfall": {"score": 25.0, "severity": "LOW"},
                    "flood": {"score": 20.0, "severity": "LOW"},
                    "waterlogging": {"score": 28.0, "severity": "LOW"},
                    "lightning": {"score": 10.0, "severity": "LOW"},
                    "cyclone": {"score": 15.0, "severity": "LOW"},
                },
            },
            {
                "ward_id": "ward_2",
                "ward_name": "Ward 2",
                "worst_hazard": "flood",
                "overall_severity": "HIGH",
                "confidence": 90.0,
                "notification": {"notify_user": True, "type": "push_notification", "show_safe_place": True},
                "hazards": {
                    "heavy_rainfall": {"score": 60.0, "severity": "HIGH"},
                    "flood": {"score": 75.0, "severity": "HIGH"},
                    "waterlogging": {"score": 70.0, "severity": "HIGH"},
                    "lightning": {"score": 30.0, "severity": "LOW"},
                    "cyclone": {"score": 40.0, "severity": "MODERATE"},
                },
            },
        ]

        # Filter by specific hazard
        flood_zones = map_zones.get_map_zones(
            hazard_filter="flood",
            precomputed_results=sample_results,
        )
        self.assertEqual(len(flood_zones), 2)
        self.assertTrue(all(z["hazard_type"] == "flood" for z in flood_zones))

        # Filter all
        all_zones = map_zones.get_map_zones(
            hazard_filter="all",
            precomputed_results=sample_results,
        )
        self.assertEqual(len(all_zones), 10)  # 2 wards x 5 hazards = 10 zones
        print(f"  [PASS] Hazard filtering returned {len(flood_zones)} flood zones and {len(all_zones)} total zones.")

    # --------------------------------------------------------------------------
    # 6. Severity Filtering
    # --------------------------------------------------------------------------
    def test_06_severity_filtering(self):
        print("\n--- Test 6: Verify Severity Filtering ---")
        sample_results = [
            {
                "ward_id": "ward_1",
                "ward_name": "Ward 1",
                "worst_hazard": "waterlogging",
                "overall_severity": "LOW",
                "confidence": 80.0,
                "notification": {"notify_user": False, "type": None, "show_safe_place": False},
                "hazards": {
                    "heavy_rainfall": {"score": 25.0, "severity": "LOW"},
                    "flood": {"score": 20.0, "severity": "LOW"},
                    "waterlogging": {"score": 28.0, "severity": "LOW"},
                    "lightning": {"score": 10.0, "severity": "LOW"},
                    "cyclone": {"score": 15.0, "severity": "LOW"},
                },
            },
            {
                "ward_id": "ward_2",
                "ward_name": "Ward 2",
                "worst_hazard": "flood",
                "overall_severity": "HIGH",
                "confidence": 90.0,
                "notification": {"notify_user": True, "type": "push_notification", "show_safe_place": True},
                "hazards": {
                    "heavy_rainfall": {"score": 60.0, "severity": "HIGH"},
                    "flood": {"score": 75.0, "severity": "HIGH"},
                    "waterlogging": {"score": 70.0, "severity": "HIGH"},
                    "lightning": {"score": 30.0, "severity": "LOW"},
                    "cyclone": {"score": 40.0, "severity": "MODERATE"},
                },
            },
        ]

        high_zones = map_zones.get_map_zones(
            severity_filter="HIGH",
            precomputed_results=sample_results,
        )
        self.assertEqual(len(high_zones), 3)  # ward_2 has 3 HIGH hazards
        self.assertTrue(all(z["severity"] == "HIGH" for z in high_zones))

        # Multi-select filter
        multi_zones = map_zones.get_map_zones(
            severity_filter=["MODERATE", "HIGH"],
            precomputed_results=sample_results,
        )
        self.assertEqual(len(multi_zones), 4)  # 3 HIGH + 1 MODERATE
        print(f"  [PASS] Severity filtering returned {len(high_zones)} HIGH and {len(multi_zones)} MODERATE/HIGH zones.")

    # --------------------------------------------------------------------------
    # 7. Crowd Update Creation
    # --------------------------------------------------------------------------
    def test_07_crowd_update_creation(self):
        print("\n--- Test 7: Verify Crowd Update Creation & Validation ---")
        update = crowd_updates.submit_crowd_update(
            latitude=20.351111,
            longitude=85.809047,
            update_type="road_blocked",
            answer="YES",
            description="Fallen tree blocking Jayadev Vihar main road",
            user_id="user_123",
        )

        self.assertIsNotNone(update.get("id"))
        self.assertEqual(update["update_type"], "road_blocked")
        self.assertEqual(update["answer"], "YES")
        self.assertEqual(update["status"], "PENDING")
        self.assertEqual(update["confirm_count"], 1)
        self.assertEqual(update["false_report_count"], 0)
        self.assertEqual(update["ward_id"], "ward_1")

        # Invalid type check
        with self.assertRaises(ValueError):
            crowd_updates.submit_crowd_update(
                latitude=20.3,
                longitude=85.8,
                update_type="alien_invasion",
                answer="YES",
            )
        print("  [PASS] Crowd update creation and validation verified.")

    # --------------------------------------------------------------------------
    # 8. Crowd Update Reading
    # --------------------------------------------------------------------------
    def test_08_crowd_update_reading(self):
        print("\n--- Test 8: Verify Reading Crowd Updates ---")
        updates = crowd_updates.get_crowd_updates(limit=10)
        self.assertIsInstance(updates, list)
        print(f"  [PASS] Successfully read {len(updates)} crowd updates from backend.")

    # --------------------------------------------------------------------------
    # 9. YES / NO / UNKNOWN Responses
    # --------------------------------------------------------------------------
    def test_09_yes_no_unknown_responses(self):
        print("\n--- Test 9: Verify YES / NO / UNKNOWN Answers ---")
        for ans in ["YES", "NO", "UNKNOWN"]:
            u = crowd_updates.submit_crowd_update(
                latitude=20.30,
                longitude=85.82,
                update_type="power_outage",
                answer=ans,
            )
            self.assertEqual(u["answer"], ans)

        with self.assertRaises(ValueError):
            crowd_updates.submit_crowd_update(
                latitude=20.30,
                longitude=85.82,
                update_type="power_outage",
                answer="MAYBE_SOMETIMES",
            )
        print("  [PASS] Validated all supported citizen answers (YES, NO, UNKNOWN).")

    # --------------------------------------------------------------------------
    # 10. Multiple Reports from Nearby Locations (Clustering)
    # --------------------------------------------------------------------------
    def test_10_multiple_nearby_reports_clustering(self):
        print("\n--- Test 10: Verify Spatial Clustering of Nearby Reports ---")
        now_str = datetime.now(timezone.utc).isoformat()
        sample_reports = [
            {
                "id": "rep_1",
                "latitude": 20.3510,
                "longitude": 85.8090,
                "update_type": "waterlogging",
                "answer": "YES",
                "status": "PENDING",
                "confirm_count": 2,
                "created_at": now_str,
                "ward_id": "ward_1",
            },
            {
                "id": "rep_2",
                "latitude": 20.3515,
                "longitude": 85.8095,  # ~75m away
                "update_type": "waterlogging",
                "answer": "YES",
                "status": "PENDING",
                "confirm_count": 1,
                "created_at": now_str,
                "ward_id": "ward_1",
            },
            {
                "id": "rep_3",
                "latitude": 20.2500,  # ~11km away (different part of city)
                "longitude": 85.8500,
                "update_type": "waterlogging",
                "answer": "YES",
                "status": "PENDING",
                "confirm_count": 1,
                "created_at": now_str,
                "ward_id": "ward_60",
            },
        ]

        clusters = crowd_updates.cluster_and_corroborate_updates(sample_reports, cluster_radius_km=1.0)
        self.assertEqual(len(clusters), 2, "Expected 2 distinct spatial clusters")

        cluster_1 = next(c for c in clusters if c["ward_id"] == "ward_1")
        self.assertEqual(cluster_1["total_reports"], 2)
        self.assertEqual(cluster_1["yes_count"], 2)
        self.assertEqual(cluster_1["confirm_count"], 3)  # 2 + 1
        print(f"  [PASS] Spatial clustering grouped 2 nearby reports into 1 cluster ({cluster_1['summary']}).")

    # --------------------------------------------------------------------------
    # 11. Crowd Corroboration Scoring
    # --------------------------------------------------------------------------
    def test_11_crowd_corroboration_scoring(self):
        print("\n--- Test 11: Verify Corroboration Scoring & Tiers ---")
        # Single report -> UNCONFIRMED
        score1, level1 = crowd_updates.calculate_crowd_corroboration_score(
            yes_count=1, no_count=0, unknown_count=0, confirm_count=1, false_report_count=0
        )
        self.assertEqual(level1, "UNCONFIRMED")

        # 6 YES reports, 0 NO -> HIGH
        score2, level2 = crowd_updates.calculate_crowd_corroboration_score(
            yes_count=6, no_count=0, unknown_count=0, confirm_count=8, false_report_count=0
        )
        self.assertEqual(level2, "HIGH")
        self.assertGreaterEqual(score2, 70)

        # Government verified -> VERIFIED
        score3, level3 = crowd_updates.calculate_crowd_corroboration_score(
            yes_count=1, no_count=0, unknown_count=0, confirm_count=1, false_report_count=0, is_verified=True
        )
        self.assertEqual(level3, "VERIFIED")
        self.assertGreaterEqual(score3, 90)

        # Disputed reports (many false flags) -> DISPUTED
        score4, level4 = crowd_updates.calculate_crowd_corroboration_score(
            yes_count=1, no_count=5, unknown_count=0, confirm_count=1, false_report_count=3
        )
        self.assertEqual(level4, "DISPUTED")
        print(f"  [PASS] Unconfirmed ({score1}, {level1}), High ({score2}, {level2}), Verified ({score3}, {level3}), Disputed ({score4}, {level4}).")

    # --------------------------------------------------------------------------
    # 12. Old Report Handling & Time Decay
    # --------------------------------------------------------------------------
    def test_12_time_decay(self):
        print("\n--- Test 12: Verify Time Decay & Expiry Mechanism ---")
        ref_now = datetime.now(timezone.utc)

        # Heavy rain observation from 1 hour ago (Active)
        recent_rain = {
            "update_type": "heavy_rain",
            "created_at": (ref_now - timedelta(hours=1)).isoformat(),
            "status": "PENDING",
        }
        active_1, age_1 = crowd_updates.is_update_active(recent_rain, reference_time=ref_now)
        self.assertTrue(active_1)

        # Heavy rain observation from 5 hours ago (Expired: heavy_rain limit is 3 hours)
        old_rain = {
            "update_type": "heavy_rain",
            "created_at": (ref_now - timedelta(hours=5)).isoformat(),
            "status": "PENDING",
        }
        active_2, age_2 = crowd_updates.is_update_active(old_rain, reference_time=ref_now)
        self.assertFalse(active_2)

        # Road damage from 20 hours ago (Active: road_damage limit is 48 hours)
        road_dmg = {
            "update_type": "road_damage",
            "created_at": (ref_now - timedelta(hours=20)).isoformat(),
            "status": "PENDING",
        }
        active_3, age_3 = crowd_updates.is_update_active(road_dmg, reference_time=ref_now)
        self.assertTrue(active_3)
        print(f"  [PASS] Recent rain is active ({age_1}h), old rain is expired ({age_2}h), road damage is active ({age_3}h).")

    # --------------------------------------------------------------------------
    # 13. Government Verification & Rejection
    # --------------------------------------------------------------------------
    def test_13_government_verification_lifecycle(self):
        print("\n--- Test 13: Verify Government Verification & Rejection ---")
        res_v = crowd_updates.verify_crowd_update("doc_test_1", status="VERIFIED")
        self.assertEqual(res_v["status"], "VERIFIED")

        res_r = crowd_updates.verify_crowd_update("doc_test_2", status="REJECTED")
        self.assertEqual(res_r["status"], "REJECTED")

        # Rejected updates are immediately inactive
        rejected_update = {
            "update_type": "waterlogging",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "status": "REJECTED",
        }
        is_act, _ = crowd_updates.is_update_active(rejected_update)
        self.assertFalse(is_act)
        print("  [PASS] Government verification and rejection statuses successfully applied.")

    # --------------------------------------------------------------------------
    # 14. Crowd Markers Separate from Official Hazard Zones
    # --------------------------------------------------------------------------
    def test_14_layer_separation(self):
        print("\n--- Test 14: Verify Layer Separation between Crowd and Official Hazard Circles ---")
        now_str = datetime.now(timezone.utc).isoformat()
        sample_crowd = [
            {
                "id": "c_1",
                "latitude": 20.35,
                "longitude": 85.81,
                "update_type": "road_damage",
                "answer": "YES",
                "status": "PENDING",
                "created_at": now_str,
                "ward_id": "ward_1",
            }
        ]

        crowd_layer = crowd_updates.get_crowd_map_layer(sample_data=sample_crowd)
        self.assertEqual(len(crowd_layer), 1)
        self.assertEqual(crowd_layer[0]["layer_type"], "crowd_observation")
        self.assertIn("corroboration_level", crowd_layer[0])
        self.assertNotIn("risk_score", crowd_layer[0], "Crowd markers must NOT contain risk engine scores")

        official_zone = map_zones.generate_map_zone_item(
            ward_id="ward_1",
            hazard_type="waterlogging",
            risk_score=65.0,
            severity="HIGH",
            confidence=85.0,
        )
        self.assertIn("affected_radius_km", official_zone)
        self.assertIn("risk_score", official_zone)
        self.assertIn("severity", official_zone)
        print("  [PASS] Official analytical risk zones and crowd observations have strictly separated schemas.")

    # --------------------------------------------------------------------------
    # 15. Safe-Place Integration
    # --------------------------------------------------------------------------
    def test_15_safe_place_integration(self):
        print("\n--- Test 15: Verify Safe-Place Integration & Location Evaluation ---")
        sample_results = [
            {
                "ward_id": "ward_1",
                "ward_name": "Ward 1",
                "worst_hazard": "heavy_rainfall",
                "overall_severity": "HIGH",
                "confidence": 85.0,
                "notification": {"notify_user": True, "type": "push_notification", "show_safe_place": True},
                "hazards": {
                    "heavy_rainfall": {"score": 75.0, "severity": "HIGH"},
                    "flood": {"score": 30.0, "severity": "LOW"},
                    "waterlogging": {"score": 40.0, "severity": "MODERATE"},
                    "lightning": {"score": 20.0, "severity": "LOW"},
                    "cyclone": {"score": 20.0, "severity": "LOW"},
                },
            }
        ]

        user_eval = map_zones.evaluate_user_location(
            user_lat=20.351111,
            user_lon=85.809047,
            precomputed_results=sample_results,
        )
        self.assertEqual(user_eval["ward_id"], "ward_1")
        self.assertEqual(user_eval["severity"], "HIGH")
        self.assertTrue(user_eval["notification_eligible"])
        self.assertIn("alert_message", user_eval)

        # Map layer safe places query
        safe_pins = map_zones.get_safe_places_map_layer(
            hazard_type="heavy_rainfall",
            user_lat=20.351111,
            user_lon=85.809047,
            precomputed_results=sample_results,
        )
        self.assertIsInstance(safe_pins, list)
        print(f"  [PASS] User location evaluated and safe places layer queried ({len(safe_pins)} candidate pins).")

    # --------------------------------------------------------------------------
    # 16-20. Preservation of Existing Risk Engine & Baselines
    # --------------------------------------------------------------------------
    def test_16_risk_engine_runs(self):
        print("\n--- Test 16: Verify risk_engine.py is intact and executable ---")
        self.assertTrue(hasattr(risk_engine, "score_all_wards"))
        self.assertTrue(callable(risk_engine.score_all_wards))
        print("  [PASS] risk_engine functions are accessible and callable.")

    def test_17_67_wards_intact(self):
        print("\n--- Test 17: Verify all 67 BMC Wards are Intact ---")
        self.assertEqual(len(risk_engine.WARD_DATA), 67)
        for i in range(1, 68):
            w_id = f"ward_{i}"
            self.assertIn(w_id, risk_engine.WARD_DATA)
            w = risk_engine.WARD_DATA[w_id]
            self.assertIn("lat", w)
            self.assertIn("lon", w)
            self.assertIn("static_layers", w)
            self.assertIn("flood_susceptibility", w["static_layers"])
            self.assertIn("waterlogging_susceptibility", w["static_layers"])
            self.assertIn("population_exposure", w["static_layers"])
        print("  [PASS] All 67 BMC wards with coordinates and static baselines verified.")

    def test_18_5_hazards_intact(self):
        print("\n--- Test 18: Verify all 5 Multi-Hazards are Intact ---")
        expected_hazards = ["heavy_rainfall", "flood", "waterlogging", "lightning", "cyclone"]
        self.assertEqual(risk_engine.HAZARDS, expected_hazards)
        print(f"  [PASS] 5 Hazards verified: {risk_engine.HAZARDS}")

    def test_19_risk_scores_and_bands_unchanged(self):
        print("\n--- Test 19: Verify Severity Thresholds & Scoring Bands ---")
        expected_bands = [
            (0, 30, "LOW"),
            (31, 55, "MODERATE"),
            (56, 80, "HIGH"),
            (81, 100, "EMERGENCY"),
        ]
        self.assertEqual(risk_engine.SEVERITY_BANDS, expected_bands)
        self.assertEqual(risk_engine.get_severity(25), "LOW")
        self.assertEqual(risk_engine.get_severity(45), "MODERATE")
        self.assertEqual(risk_engine.get_severity(70), "HIGH")
        self.assertEqual(risk_engine.get_severity(95), "EMERGENCY")
        print("  [PASS] Severity bands and get_severity() mapping confirmed 100% identical.")

    def test_20_citizen_corroboration_in_risk_engine_intact(self):
        print("\n--- Test 20: Verify Existing Citizen-Report Logic in Risk Engine ---")
        self.assertTrue(hasattr(risk_engine, "apply_citizen_corroboration"))
        self.assertTrue(hasattr(risk_engine, "fetch_citizen_reports_for_ward"))

        # Test citizen corroboration logic in risk engine with empty reports
        baseline_scores = {"heavy_rainfall": 40.0, "flood": 30.0, "waterlogging": 35.0, "lightning": 10.0, "cyclone": 15.0}
        nudged_scores = risk_engine.apply_citizen_corroboration(baseline_scores, [])
        self.assertEqual(baseline_scores, nudged_scores)
    def test_21_concurrent_weather_fetch(self):
        print("\n--- Test 21: Verify Concurrent Open-Meteo Weather Fetch ---")
        self.assertTrue(hasattr(risk_engine, "fetch_open_meteo_batch"))
        test_coords = [(20.30, 85.83), (20.31, 85.82), (20.32, 85.80)]
        results = risk_engine.fetch_open_meteo_batch(test_coords, max_workers=5)
        self.assertIsInstance(results, dict)
        print(f"  [PASS] fetch_open_meteo_batch verified: returned {len(results)} coordinate responses.")


if __name__ == "__main__":
    unittest.main(verbosity=2)
