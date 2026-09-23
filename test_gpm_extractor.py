"""
Test Suite for NASA GPM IMERG Precipitation Extractor & Risk Engine Integration
================================================================================
Tests extraction of GPM IMERG V07 HDF5 satellite precipitation data
and verifies non-breaking integration with risk_engine.py.
"""

import os
import unittest
from datetime import datetime, timezone, timedelta
import gpm_extractor
import risk_engine

DEFAULT_TEST_DIR = r"C:\Users\soumya\Downloads\GPM_3IMERGHHE_07"
BHUBANESWAR_LAT = 20.30
BHUBANESWAR_LON = 85.82


class TestGPMExtractor(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.data_dir = os.environ.get("GPM_DATA_DIR", DEFAULT_TEST_DIR)
        cls.has_test_files = os.path.isdir(cls.data_dir) and len(
            [f for f in os.listdir(cls.data_dir) if f.endswith(".HDF5")]
        ) > 0

    def test_single_file_extraction_and_6_67_reading(self):
        """Verify dynamic extraction of the 6.67 mm/hr reading from the 04:30 UTC HDF5 file."""
        if not self.has_test_files:
            self.skipTest(f"Test GPM directory not found: {self.data_dir}")

        target_file = os.path.join(
            self.data_dir,
            "3B-HHR-E.MS.MRG.3IMERG.20260923-S043000-E045959.0270.V07C.HDF5",
        )
        self.assertTrue(os.path.exists(target_file), f"Target file missing: {target_file}")

        obs = gpm_extractor.extract_single_file(
            target_file, BHUBANESWAR_LAT, BHUBANESWAR_LON
        )

        self.assertEqual(obs["source"], "NASA_GPM_IMERG")
        self.assertEqual(obs["product"], "GPM_3IMERGHHE")
        self.assertEqual(obs["version"], "07")
        self.assertEqual(obs["unit"], "mm/hr")
        self.assertEqual(obs["latitude"], BHUBANESWAR_LAT)
        self.assertEqual(obs["longitude"], BHUBANESWAR_LON)
        self.assertEqual(obs["matched_grid_latitude"], 20.25)
        self.assertEqual(obs["matched_grid_longitude"], 85.85)
        self.assertEqual(obs["timestamp"], "2026-09-23T04:30:00Z")

        self.assertIsNotNone(obs["precipitation_mm_hr"])
        self.assertAlmostEqual(obs["precipitation_mm_hr"], 6.67, places=2)

    def test_batch_extraction_all_files(self):
        """Verify batch extraction over all 16 downloaded HDF5 files."""
        if not self.has_test_files:
            self.skipTest(f"Test GPM directory not found: {self.data_dir}")

        observations = gpm_extractor.extract_gpm_precipitation(
            self.data_dir, BHUBANESWAR_LAT, BHUBANESWAR_LON
        )

        self.assertEqual(len(observations), 16)
        s0430_obs = [
            o for o in observations if o["timestamp"] == "2026-09-23T04:30:00Z"
        ]
        self.assertEqual(len(s0430_obs), 1)
        self.assertAlmostEqual(s0430_obs[0]["precipitation_mm_hr"], 6.67, places=2)

        for obs in observations:
            val = obs["precipitation_mm_hr"]
            if val is not None:
                self.assertGreaterEqual(val, 0.0)

    def test_ward_level_extraction(self):
        """Verify ward-level extraction for all 67 BMC wards."""
        if not self.has_test_files:
            self.skipTest(f"Test GPM directory not found: {self.data_dir}")

        ward_data = risk_engine.WARD_DATA
        self.assertEqual(len(ward_data), 67)

        ward_results = gpm_extractor.extract_gpm_for_wards(
            self.data_dir, ward_data=ward_data
        )

        self.assertEqual(len(ward_results), 67)
        for ward_id, obs_list in ward_results.items():
            self.assertEqual(len(obs_list), 16)
            self.assertIn("ward_name", obs_list[0])
            self.assertIn("matched_grid_latitude", obs_list[0])
            self.assertIn("matched_grid_longitude", obs_list[0])


class TestGPMRiskEngineIntegration(unittest.TestCase):

    def test_confidence_computation_gpm_none(self):
        """a. Verify baseline confidence computation when GPM is None."""
        om_data = {"current": {"precipitation": 5.0}}
        tm_data = {"data": {"timelines": [{"intervals": [{"values": {"precipitationIntensity": 5.0}}]}]}}
        conf = risk_engine.compute_confidence(om_data, tm_data, citizen_reports=None, gpm_obs=None)
        self.assertEqual(conf, 90)

    def test_confidence_computation_valid_fresh_gpm(self):
        """b. Verify GPM valid fresh observation boosts confidence when diff <= 3.0."""
        om_data = {"current": {"precipitation": 5.0}}
        tm_data = {"data": {"timelines": [{"intervals": [{"values": {"precipitationIntensity": 5.0}}]}]}}
        now_str = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        gpm_obs = {
            "precipitation_mm_hr": 5.5,
            "timestamp": now_str,
        }
        conf = risk_engine.compute_confidence(om_data, tm_data, citizen_reports=None, gpm_obs=gpm_obs)
        self.assertEqual(conf, 95)  # 90 base + 5 GPM corroboration bonus

    def test_confidence_computation_missing_gpm_val(self):
        """c. Verify GPM missing value (-9999.9 mapped to None) does not alter confidence."""
        om_data = {"current": {"precipitation": 5.0}}
        tm_data = {"data": {"timelines": [{"intervals": [{"values": {"precipitationIntensity": 5.0}}]}]}}
        now_str = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        gpm_obs = {
            "precipitation_mm_hr": None,  # Mapped from -9999.9
            "timestamp": now_str,
        }
        conf = risk_engine.compute_confidence(om_data, tm_data, citizen_reports=None, gpm_obs=gpm_obs)
        self.assertEqual(conf, 90)

    def test_confidence_computation_stale_gpm_obs(self):
        """d. Verify GPM stale observation (> 12 hours old) does not alter confidence."""
        om_data = {"current": {"precipitation": 5.0}}
        tm_data = {"data": {"timelines": [{"intervals": [{"values": {"precipitationIntensity": 5.0}}]}]}}
        stale_time = datetime.now(timezone.utc) - timedelta(hours=24)
        stale_str = stale_time.isoformat().replace("+00:00", "Z")
        gpm_obs = {
            "precipitation_mm_hr": 5.5,
            "timestamp": stale_str,
        }
        conf = risk_engine.compute_confidence(om_data, tm_data, citizen_reports=None, gpm_obs=gpm_obs)
        self.assertEqual(conf, 90)  # Stale data skipped

    def test_scoring_formulas_identical_with_or_without_gpm(self):
        """e. Verify risk scoring formula results remain 100% identical with or without gpm_source."""
        signals = {
            "rain_now_mm": 10.0,
            "rain_peak_6h_mm": 25.0,
            "wind_now_kmh": 15.0,
            "gust_peak_6h_kmh": 40.0,
            "lightning_proxy": 2.0,
            "tm_rain_intensity": 10.0,
        }
        static_layers = {
            "flood_susceptibility": 75,
            "waterlogging_susceptibility": 75,
            "population_exposure": 80,
        }

        base_scores = risk_engine.score_hazards(signals, static_layers)

        # Attach GPM signal attributes
        signals_gpm = dict(signals)
        signals_gpm["gpm_precip_mm_hr"] = 12.0
        signals_gpm["gpm_timestamp"] = "2026-09-23T04:30:00Z"

        gpm_scores = risk_engine.score_hazards(signals_gpm, static_layers)

        # Ensure every hazard score is 100% identical
        self.assertEqual(base_scores, gpm_scores)

    def test_score_all_wards_with_and_without_gpm_source(self):
        """f. Integration test: score_all_wards runs seamlessly with gpm_source=None and with local dir."""
        # 1. Without GPM source
        results_none = risk_engine.score_all_wards(gpm_source=None)
        self.assertEqual(len(results_none), 67)
        self.assertNotIn("gpm_observation", results_none[0])

        # 2. With GPM source (if local directory available)
        data_dir = os.environ.get("GPM_DATA_DIR", DEFAULT_TEST_DIR)
        if os.path.isdir(data_dir):
            results_gpm = risk_engine.score_all_wards(gpm_source=data_dir)
            self.assertEqual(len(results_gpm), 67)
            self.assertIn("gpm_observation", results_gpm[0])
            self.assertIn("precipitation_mm_hr", results_gpm[0]["gpm_observation"])

            # Verify scores match identically
            for r1, r2 in zip(results_none, results_gpm):
                for h_name in risk_engine.HAZARDS:
                    self.assertEqual(
                        r1["hazards"][h_name]["score"],
                        r2["hazards"][h_name]["score"]
                    )


if __name__ == "__main__":
    unittest.main()
