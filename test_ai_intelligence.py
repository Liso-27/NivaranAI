"""
Unit Tests for AI Disaster Intelligence Layer
==============================================
Verifies all 7 approved capabilities:
1. Citizen Report Understanding (Multilingual & Hinglish text parsing to structured JSON)
2. Incident / Report Correlation
3. Trend Understanding
4. Risk / Situation Plain-Language Explanation (preserving pre-computed Risk Engine scores)
5. Ward Situation Brief Generation
6. Controlled Q&A Data Grounding
7. Role-Specific Communication Generation
"""

import unittest
import ai_disaster_intelligence


class TestAIDisasterIntelligence(unittest.TestCase):

    def test_01_parse_report_text(self):
        """Test parsing citizen report text into structured JSON."""
        sample_text = "Rasulgarh road is fully under water, bikes cannot pass and water is rising."
        res = ai_disaster_intelligence.parse_report_text(sample_text, location_hint="Rasulgarh")

        self.assertIn("hazard", res)
        self.assertIn("location_clue", res)
        self.assertIn("severity_indication", res)
        self.assertIn("road_blockage", res)
        self.assertIn("situation_trend", res)
        self.assertEqual(res["road_blockage"], "YES")
        self.assertEqual(res["situation_trend"], "worsening")

    def test_02_incident_reports_correlation(self):
        """Test correlation of multiple reports for same incident."""
        reports = [
            {"description": "Rasulgarh road is flooded with water.", "update_type": "flooding"},
            {"description": "Cars cannot cross Rasulgarh because of waterlogging.", "update_type": "flooding"}
        ]
        res = ai_disaster_intelligence.analyze_incident_reports(reports)

        self.assertIn("same_incident", res)
        self.assertIn("summary", res)
        self.assertTrue(res["same_incident"])

    def test_03_analyze_trend(self):
        """Test trend classification over timeline observations."""
        observations = [
            {"description": "water accumulating", "created_at": "14:00"},
            {"description": "road partially blocked", "created_at": "14:20"},
            {"description": "road completely blocked, water level rising", "created_at": "14:40"}
        ]
        res = ai_disaster_intelligence.analyze_trend(observations)

        self.assertIn("trend", res)
        self.assertEqual(res["trend"], "worsening")

    def test_04_explain_risk_score(self):
        """Test plain-language explanation preserves exact Risk Engine score."""
        ward_result = {
            "ward_name": "Ward 42",
            "risk_score": 78.0,
            "severity": "HIGH",
            "confidence": 82,
            "hazards": {
                "flood": {"score": 78.0, "severity": "HIGH"}
            }
        }
        res = ai_disaster_intelligence.explain_risk_score(ward_result, "flood")

        self.assertEqual(res["official_score"], 78.0)
        self.assertEqual(res["severity"], "HIGH")
        self.assertIn("explanation", res)

    def test_05_generate_situation_brief(self):
        """Test Ward Situation Brief synthesis."""
        brief = ai_disaster_intelligence.generate_situation_brief(ward_id=15)

        self.assertIn("ward_name", brief)
        self.assertIn("primary_hazard", brief)
        self.assertIn("situation_brief", brief)
        self.assertIn("corroborated_reports", brief)

    def test_06_answer_controlled_question(self):
        """Test controlled Q&A grounding in real system data."""
        q1 = "Why is Ward 15 high risk?"
        res1 = ai_disaster_intelligence.answer_controlled_question(q1)
        self.assertIn("answer", res1)
        self.assertIn("sources_used", res1)

        q2 = "What safe places are available?"
        res2 = ai_disaster_intelligence.answer_controlled_question(q2)
        self.assertIn("answer", res2)

    def test_07_role_specific_communication(self):
        """Test generating role-specific communications for Citizen, Government, and Dashboard."""
        cit_msg = ai_disaster_intelligence.generate_role_specific_communication(ward_id=4, role="citizen")
        self.assertEqual(cit_msg["role"], "citizen")
        self.assertIn("message", cit_msg)

        gov_msg = ai_disaster_intelligence.generate_role_specific_communication(ward_id=4, role="government")
        self.assertEqual(gov_msg["role"], "government")
        self.assertIn("message", gov_msg)

        dash_msg = ai_disaster_intelligence.generate_role_specific_communication(ward_id=4, role="dashboard")
        self.assertEqual(dash_msg["role"], "dashboard")
        self.assertIn("message", dash_msg)


if __name__ == "__main__":
    unittest.main()
