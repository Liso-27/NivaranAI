"""
Unit Tests for TrustShield Credibility & Validation Layer
"""

import unittest
from datetime import datetime, timezone, timedelta

import trust_shield
import crowd_updates


class TestTrustShield(unittest.TestCase):

    def setUp(self):
        trust_shield.clear_report_cache()

    def test_01_normal_valid_report(self):
        """Test submitting a normal valid report yields Plausible classification."""
        res = trust_shield.evaluate_report(
            latitude=20.2961,
            longitude=85.8245,
            update_type="waterlogging",
            description="Water accumulation near Master Canteen square",
            user_id="user_test_101",
            ward_id=30
        )
        self.assertIn(res["classification"], ["Plausible", "Corroborated"])
        self.assertTrue(res["checks"]["location_check"]["passed"])
        self.assertTrue(res["checks"]["time_check"]["passed"])
        self.assertFalse(res["checks"]["duplicate_check"]["is_duplicate"])

    def test_02_duplicate_report(self):
        """Test near-identical duplicate submission within short window flags duplicate."""
        report1 = crowd_updates.submit_crowd_update(
            latitude=20.2961,
            longitude=85.8245,
            update_type="flooding",
            description="Severe flooding near Rasulgarh square",
            user_id="user_dup_1"
        )

        # Duplicate submission
        report2 = crowd_updates.submit_crowd_update(
            latitude=20.2962,
            longitude=85.8246,
            update_type="flooding",
            description="Severe flooding near Rasulgarh square",
            user_id="user_dup_1"
        )

        self.assertEqual(report2["trust_classification"], "Rejected")
        self.assertTrue(report2["trust_shield"]["checks"]["duplicate_check"]["is_duplicate"])

    def test_03_old_stale_report(self):
        """Test old timestamp (>48h) flags time check."""
        old_iso = (datetime.now(timezone.utc) - timedelta(hours=72)).isoformat()
        res = trust_shield.evaluate_report(
            latitude=20.2961,
            longitude=85.8245,
            update_type="heavy_rain",
            description="Past heavy rain observation",
            created_at_iso=old_iso
        )

        self.assertFalse(res["checks"]["time_check"]["passed"])
        self.assertIn(res["classification"], ["Suspicious", "Pending"])

    def test_04_multiple_nearby_reports_incident_grouping(self):
        """Test multiple nearby reports form an incident cluster and yield Corroborated."""
        rep1 = crowd_updates.submit_crowd_update(
            latitude=20.2961,
            longitude=85.8245,
            update_type="flooding",
            description="Rasulgarh road waterlogging",
            user_id="user_cluster_1"
        )
        rep2 = crowd_updates.submit_crowd_update(
            latitude=20.2965,
            longitude=85.8248,
            update_type="flooding",
            description="Water rising on Rasulgarh road",
            user_id="user_cluster_2"
        )

        self.assertEqual(rep2["trust_classification"], "Corroborated")
        self.assertTrue(rep2["trust_shield"]["checks"]["incident_grouping"]["has_incident_cluster"])

    def test_05_report_without_image(self):
        """Test report without image handles photo check safely as neutral."""
        res = trust_shield.evaluate_report(
            latitude=20.2961,
            longitude=85.8245,
            update_type="road_blocked",
            description="Tree down blocking road",
            photo_url=""
        )

        self.assertTrue(res["checks"]["photo_check"]["passed"])
        self.assertEqual(res["checks"]["photo_check"]["metadata_status"], "NO_PHOTO_NEUTRAL")

    def test_06_report_with_image_metadata(self):
        """Test report with photo metadata handles photo check correctly."""
        res = trust_shield.evaluate_report(
            latitude=20.2961,
            longitude=85.8245,
            update_type="waterlogging",
            description="Road under water",
            photo_url="https://example.com/photo.jpg?exif=true"
        )

        self.assertTrue(res["checks"]["photo_check"]["passed"])
        self.assertEqual(res["checks"]["photo_check"]["metadata_status"], "METADATA_PRESENT")

    def test_07_out_of_bounds_location(self):
        """Test coordinates far outside Bhubaneswar flag location check failure."""
        res = trust_shield.evaluate_report(
            latitude=12.9716, # Bengaluru coordinates
            longitude=77.5946,
            update_type="flooding",
            description="Fake location report"
        )

        self.assertFalse(res["checks"]["location_check"]["passed"])
        self.assertEqual(res["classification"], "Suspicious")


if __name__ == "__main__":
    unittest.main()
