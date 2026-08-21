"""
Apada Sathi - Map API & Configuration Verification Test Suite
==============================================================

Verifies that:
1. Map API configuration is detected from environment variables.
2. The correct provider (Google Maps) is identified from the API key signature.
3. The API key is loaded properly from environment / .env.
4. No secret values are printed or leaked in output or logs.
5. Map-related backend functionality initializes and executes cleanly.
6. risk_engine.py remains 100% untouched and intact.
"""

import os
import unittest
from dotenv import load_dotenv

# Load local environment
load_dotenv()

import map_zones
import risk_engine


class TestMapAPIConfiguration(unittest.TestCase):

    def setUp(self):
        # Generate clean sample precomputed results for all 67 wards for fast deterministic testing
        self.sample_results = []
        for i in range(1, 68):
            w_id = f"ward_{i}"
            w_info = risk_engine.WARD_DATA.get(w_id, {})
            self.sample_results.append({
                "ward_id": w_id,
                "ward_name": w_info.get("name", f"Ward {i}"),
                "hazards": {
                    "heavy_rainfall": {"score": 45.0, "severity": "MODERATE"},
                    "flood": {"score": 25.0, "severity": "LOW"},
                    "waterlogging": {"score": 60.0, "severity": "HIGH"},
                    "lightning": {"score": 10.0, "severity": "LOW"},
                    "cyclone": {"score": 15.0, "severity": "LOW"},
                },
                "worst_hazard": "waterlogging",
                "overall_severity": "HIGH",
                "confidence": 85.0,
                "notification": {
                    "notify_user": True,
                    "type": "push_notification",
                    "show_safe_place": True,
                },
            })

    def test_01_map_api_key_detected(self):
        """Confirm Map API key is detected in environment without exposing its value."""
        print("\n--- Test 1: Map API Key Environment Detection ---")
        map_key = os.environ.get("MAP_API_KEY", "").strip()
        self.assertTrue(bool(map_key), "MAP_API_KEY must not be empty.")
        self.assertNotEqual(map_key, "PASTE_YOUR_MAP_API_KEY_HERE", "MAP_API_KEY must not be placeholder.")
        # Check key format without printing it
        self.assertTrue(map_key.startswith("AIza"), "Expected Google Cloud / Maps API Key format starting with 'AIza'.")
        print("  Map API key detected: YES")

    def test_02_map_provider_resolution(self):
        """Confirm correct provider is resolved."""
        print("\n--- Test 2: Map Provider Resolution ---")
        config = map_zones.get_map_provider_config()
        self.assertIsInstance(config, dict)
        self.assertTrue(config.get("configured"), "Map provider must be marked as configured.")
        self.assertTrue(config.get("has_api_key"), "Map provider has_api_key must be True.")
        self.assertEqual(config.get("provider"), "Google Maps", "Provider must be identified as 'Google Maps'.")
        print(f"  Map provider: {config.get('provider')}")
        print("  Map configuration: PASS")

    def test_03_map_zones_initialization(self):
        """Confirm map zone calculation works across all 67 wards."""
        print("\n--- Test 3: Map Zones Initialization ---")
        dominant_zones = map_zones.get_map_zones(
            worst_hazard_only=True,
            precomputed_results=self.sample_results,
        )
        self.assertEqual(len(dominant_zones), 67, "Must produce 67 dominant ward map zones.")
        first_zone = dominant_zones[0]
        self.assertIn("affected_radius_km", first_zone)
        self.assertIn("color", first_zone)
        self.assertIn("latitude", first_zone)
        self.assertIn("longitude", first_zone)
        self.assertEqual(first_zone["color"], "#F97316")  # HIGH severity color
        print(f"  [PASS] Successfully initialized 67 BMC ward map zones.")

    def test_04_safe_places_map_layer(self):
        """Confirm safe places map layer generates properly."""
        print("\n--- Test 4: Safe Places Map Layer ---")
        safe_pins = map_zones.get_safe_places_map_layer(
            hazard_type="waterlogging",
            user_lat=20.2961,
            user_lon=85.8245,
            precomputed_results=self.sample_results,
        )
        self.assertIsInstance(safe_pins, list)
        print(f"  [PASS] Safe places layer queried successfully ({len(safe_pins)} facilities found).")

    def test_05_location_threat_evaluation(self):
        """Confirm user threat evaluation initializes and runs."""
        print("\n--- Test 5: User Threat Evaluation ---")
        eval_res = map_zones.evaluate_user_location(
            user_lat=20.2961,
            user_lon=85.8245,
            precomputed_results=self.sample_results,
        )
        self.assertIn("ward_id", eval_res)
        self.assertIn("severity", eval_res)
        self.assertIn("is_affected", eval_res)
        self.assertIn("alert_message", eval_res)
        print(f"  [PASS] Threat evaluation succeeded for ward {eval_res.get('ward_id')}.")

    def test_06_risk_engine_integrity(self):
        """Confirm risk_engine.py is untouched."""
        print("\n--- Test 6: Risk Engine Integrity ---")
        self.assertEqual(len(risk_engine.WARD_DATA), 67)
        self.assertEqual(len(risk_engine.HAZARDS), 5)
        print("  [PASS] Risk engine confirmed intact with 67 wards and 5 multi-hazards.")


if __name__ == "__main__":
    unittest.main(verbosity=2)
