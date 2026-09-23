"""
Test Suite for NASA GPM Live Downloader & Cache Manager Service
================================================================
Tests caching, duplicate detection, mock CMR responses, network error handling,
cache directory creation, and integration with gpm_extractor.
"""

import os
import shutil
import tempfile
import unittest
from unittest.mock import MagicMock, patch

import gpm_extractor
import gpm_live_service


class TestGPMLiveService(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.mkdtemp(prefix="gpm_cache_test_")

    def tearDown(self):
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

    def test_cache_directory_created_if_missing(self):
        """Verify cache directory is created automatically if it does not exist."""
        new_dir = os.path.join(self.temp_dir, "nested", "cache")
        self.assertFalse(os.path.exists(new_dir))
        result_dir = gpm_live_service.get_cache_directory(new_dir)
        self.assertTrue(os.path.exists(result_dir))
        self.assertEqual(result_dir, os.path.abspath(new_dir))

    @patch("gpm_live_service.query_latest_gpm_granules")
    def test_duplicate_granule_skipped(self, mock_cmr):
        """Verify an existing valid HDF5 file is recognized and skipped rather than downloaded again."""
        granule_name = "3B-HHR-E.MS.MRG.3IMERG.20260923-S043000-E045959.0270.V07C.HDF5"
        mock_cmr.return_value = [
            {
                "granule_id": granule_name,
                "title": granule_name,
                "download_url": f"https://example.com/{granule_name}",
                "time_start": "2026-09-23T04:30:00Z",
            }
        ]

        # Copy dummy valid HDF5 file to test cache directory
        real_hdf5 = r"C:\Users\soumya\Downloads\GPM_3IMERGHHE_07\3B-HHR-E.MS.MRG.3IMERG.20260923-S043000-E045959.0270.V07C.HDF5"
        if os.path.exists(real_hdf5):
            shutil.copy(real_hdf5, os.path.join(self.temp_dir, granule_name))

        report = gpm_live_service.fetch_latest_gpm(
            cache_dir=self.temp_dir, max_granules=1, bearer_token="mock_token"
        )

        self.assertIn(granule_name, report["skipped_files"])
        self.assertEqual(len(report["downloaded_files"]), 0)
        self.assertEqual(report["status"], "UP_TO_DATE")

    @patch("requests.get")
    def test_cmr_query_failure_handled_safely(self, mock_get):
        """Verify network/CMR failures are handled gracefully without raising exceptions."""
        mock_get.side_effect = Exception("Connection timeout")

        granules = gpm_live_service.query_latest_gpm_granules(timeout_seconds=1)
        self.assertEqual(granules, [])

        report = gpm_live_service.fetch_latest_gpm(cache_dir=self.temp_dir)
        self.assertIn(report["status"], ("NO_CREDENTIALS", "NO_GRANULES_FOUND"))

    def test_no_credentials_mode(self):
        """Verify report returns NO_CREDENTIALS mode safely when token is missing/placeholder."""
        report = gpm_live_service.fetch_latest_gpm(
            cache_dir=self.temp_dir,
            bearer_token="PASTE_YOUR_EARTHDATA_BEARER_TOKEN_HERE",
            username="",
            password="",
        )
        self.assertFalse(report["auth_configured"])
        self.assertEqual(report["status"], "NO_CREDENTIALS")

    def test_get_active_gpm_source_with_valid_cache(self):
        """Verify get_active_gpm_source returns valid cache dir or None."""
        # Empty cache returns None
        self.assertIsNone(gpm_live_service.get_active_gpm_source(self.temp_dir))

        # Copy real test file into temp_dir
        real_hdf5 = r"C:\Users\soumya\Downloads\GPM_3IMERGHHE_07\3B-HHR-E.MS.MRG.3IMERG.20260923-S043000-E045959.0270.V07C.HDF5"
        if os.path.exists(real_hdf5):
            shutil.copy(real_hdf5, os.path.join(self.temp_dir, "test.HDF5"))
            active_src = gpm_live_service.get_active_gpm_source(self.temp_dir)
            self.assertIsNotNone(active_src)
            self.assertEqual(active_src, os.path.abspath(self.temp_dir))

            # Test consumption by gpm_extractor
            obs = gpm_extractor.extract_gpm_precipitation(active_src, 20.30, 85.82)
            self.assertEqual(len(obs), 1)
            self.assertAlmostEqual(obs[0]["precipitation_mm_hr"], 6.67, places=2)

    def test_cache_pruning(self):
        """Verify old files in cache are pruned when max_files threshold is reached."""
        # Create 5 dummy text/hdf5 files
        for i in range(5):
            f_path = os.path.join(self.temp_dir, f"file_{i}.HDF5")
            with open(f_path, "w") as f:
                f.write("dummy")
            # Touch mtime sequentially
            os.utime(f_path, (1000 + i * 10, 1000 + i * 10))

        removed = gpm_live_service.prune_old_cache_files(self.temp_dir, max_files=3)
        self.assertEqual(removed, 2)
        remaining = os.listdir(self.temp_dir)
        self.assertEqual(len(remaining), 3)


if __name__ == "__main__":
    unittest.main()
