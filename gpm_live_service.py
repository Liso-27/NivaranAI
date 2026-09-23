"""
NASA GPM IMERG Automated Live Downloader & Cache Manager Service
=================================================================
Apada Sathi / NivaranAI Backend Module

Capabilities:
1. Queries NASA CMR (Common Metadata Repository) for latest GPM IMERG Early Run granules
   covering the Bhubaneswar / Odisha bounding box area.
2. Downloads needed HDF5 granules into a configurable local cache directory.
3. Prevents duplicate downloads using granule filename checks.
4. Uses atomic download writes (.tmp -> .HDF5) with h5py integrity validation.
5. Securely loads Earthdata credentials from environment variables (never source code).
6. Provides graceful fallbacks when offline or when credentials are not configured.
7. Exposes get_active_gpm_source() for seamless consumption by gpm_extractor & risk_engine.
"""

import os
import re
import shutil
import tempfile
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
import requests
from dotenv import load_dotenv

import h5py

load_dotenv()

# ==============================================================================
# CONFIGURATION & CONSTANTS
# ==============================================================================

# NASA CMR Granule Search API Endpoint (Public metadata API, no credentials required)
CMR_GRANULE_SEARCH_URL = "https://cmr.earthdata.nasa.gov/search/granules.json"
GPM_SHORT_NAME = "GPM_3IMERGHHE"
GPM_VERSION = "07"

# Spatial bounding box for Bhubaneswar / BMC region (min_lon, min_lat, max_lon, max_lat)
BHUBANESWAR_BBOX = (85.0, 20.0, 86.5, 21.0)

# Environment configuration
EARTHDATA_BEARER_TOKEN = os.environ.get("EARTHDATA_BEARER_TOKEN", "").strip()
EARTHDATA_USERNAME = os.environ.get("EARTHDATA_USERNAME", "").strip()
EARTHDATA_PASSWORD = os.environ.get("EARTHDATA_PASSWORD", "").strip()

DEFAULT_CACHE_DIR = os.environ.get(
    "GPM_CACHE_DIR", os.path.join(os.getcwd(), "data", "gpm_cache")
)
MAX_CACHE_FILES = int(os.environ.get("GPM_CACHE_MAX_FILES", "48"))


def get_cache_directory(custom_path: Optional[str] = None) -> str:
    """Returns absolute path to the GPM cache directory, ensuring it exists."""
    target_dir = os.path.abspath(custom_path or DEFAULT_CACHE_DIR)
    os.makedirs(target_dir, exist_ok=True)
    return target_dir


def is_valid_hdf5_file(file_path: str) -> bool:
    """Validates if an HDF5 file exists and is uncorrupted."""
    if not os.path.isfile(file_path) or os.path.getsize(file_path) == 0:
        return False
    try:
        return h5py.is_hdf5(file_path)
    except Exception:
        return False


def query_latest_gpm_granules(
    short_name: str = GPM_SHORT_NAME,
    version: str = GPM_VERSION,
    bbox: Tuple[float, float, float, float] = BHUBANESWAR_BBOX,
    page_size: int = 10,
    timeout_seconds: int = 10,
) -> List[Dict[str, Any]]:
    """
    Queries NASA CMR Search API for the latest GPM granules matching parameters.
    Returns list of granule metadata dicts sorted newest-first.
    """
    params = {
        "short_name": short_name,
        "version": version,
        "bounding_box": f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}",
        "sort_key": "-start_date",
        "page_size": page_size,
    }
    try:
        r = requests.get(CMR_GRANULE_SEARCH_URL, params=params, timeout=timeout_seconds)
        r.raise_for_status()
        data = r.json()
        entries = data.get("feed", {}).get("entry", [])
        granules = []
        for entry in entries:
            title = entry.get("title", "")
            download_url = None
            for link in entry.get("links", []):
                href = link.get("href", "")
                if href.endswith(".HDF5") or href.endswith(".hdf5") or "datapool" in href or "hyrax" in href:
                    download_url = href
                    break
            granules.append(
                {
                    "granule_id": title,
                    "title": title,
                    "producer_granule_id": entry.get("producer_granule_id", title),
                    "download_url": download_url,
                    "time_start": entry.get("time_start"),
                    "time_end": entry.get("time_end"),
                    "updated": entry.get("updated"),
                }
            )
        return granules
    except Exception as e:
        print(f"Warning: NASA CMR granule query failed: {e}")
        return []


def download_granule_file(
    download_url: str,
    dest_path: str,
    bearer_token: Optional[str] = None,
    username: Optional[str] = None,
    password: Optional[str] = None,
    timeout_seconds: int = 30,
) -> bool:
    """
    Downloads a GPM HDF5 file atomically using temporary file write and
    h5py file verification. Credentials are sent via standard Authorization headers.
    """
    headers = {}
    auth = None

    token = bearer_token or EARTHDATA_BEARER_TOKEN
    uname = username or EARTHDATA_USERNAME
    passwd = password or EARTHDATA_PASSWORD

    if token and not token.startswith("PASTE_"):
        headers["Authorization"] = f"Bearer {token}"
    elif uname and passwd and not uname.startswith("PASTE_"):
        auth = (uname, passwd)

    dest_dir = os.path.dirname(dest_path)
    os.makedirs(dest_dir, exist_ok=True)

    try:
        with requests.get(download_url, headers=headers, auth=auth, stream=True, timeout=timeout_seconds) as response:
            if response.status_code in (401, 403):
                print(f"Warning: NASA Earthdata authentication failed (HTTP {response.status_code}).")
                return False
            response.raise_for_status()

            temp_fd, temp_path = tempfile.mkstemp(dir=dest_dir, suffix=".tmp")
            try:
                with os.fdopen(temp_fd, "wb") as f_out:
                    shutil.copyfileobj(response.raw, f_out)

                if is_valid_hdf5_file(temp_path):
                    shutil.move(temp_path, dest_path)
                    return True
                else:
                    print(f"Warning: Downloaded GPM file failed HDF5 validation: {dest_path}")
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
                    return False
            except Exception as e:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                raise e
    except Exception as e:
        print(f"Warning: GPM download error for {download_url}: {e}")
        return False


def prune_old_cache_files(cache_dir: str, max_files: int = MAX_CACHE_FILES) -> int:
    """
    Removes oldest GPM cache files if count exceeds max_files.
    Preserves manual user/test files if they don't match standard cache format or if count <= max_files.
    """
    if not os.path.isdir(cache_dir):
        return 0

    files = [
        os.path.join(cache_dir, f)
        for f in os.listdir(cache_dir)
        if f.endswith((".HDF5", ".hdf5", ".h5"))
    ]
    if len(files) <= max_files:
        return 0

    files.sort(key=lambda p: os.path.getmtime(p))
    remove_count = len(files) - max_files
    removed = 0
    for f in files[:remove_count]:
        try:
            os.remove(f)
            removed += 1
        except Exception:
            pass
    return removed


def fetch_latest_gpm(
    cache_dir: Optional[str] = None,
    max_granules: int = 1,
    bbox: Tuple[float, float, float, float] = BHUBANESWAR_BBOX,
    bearer_token: Optional[str] = None,
    username: Optional[str] = None,
    password: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Primary API entry point:
    1. Checks cache for existing granules.
    2. Queries NASA CMR for latest granules.
    3. Downloads missing granules if Earthdata credentials are provided.
    4. Prunes old cache files.
    5. Returns structured report.
    """
    active_dir = get_cache_directory(cache_dir)
    token = bearer_token or EARTHDATA_BEARER_TOKEN
    uname = username or EARTHDATA_USERNAME
    has_auth = bool((token and not token.startswith("PASTE_")) or (uname and not uname.startswith("PASTE_")))

    report: Dict[str, Any] = {
        "status": "INITIALIZED",
        "auth_configured": has_auth,
        "cache_dir": active_dir,
        "latest_available_timestamp": None,
        "latest_granule_name": None,
        "downloaded_files": [],
        "skipped_files": [],
        "failed_files": [],
        "total_cached_files": 0,
        "active_gpm_source": active_dir,
    }

    # Query CMR metadata
    granules = query_latest_gpm_granules(bbox=bbox, page_size=max(5, max_granules))
    if granules:
        latest = granules[0]
        report["latest_granule_name"] = latest["title"]
        report["latest_available_timestamp"] = latest.get("time_start")

    # Process requested granules
    target_granules = granules[:max_granules]
    for g in target_granules:
        g_name = g["title"]
        if not g_name.endswith(".HDF5") and not g_name.endswith(".hdf5"):
            g_name = f"{g_name}.HDF5"

        dest_file = os.path.join(active_dir, g_name)

        # Check duplicate in cache
        if is_valid_hdf5_file(dest_file):
            report["skipped_files"].append(g_name)
            continue

        if not has_auth:
            report["status"] = "NO_CREDENTIALS"
            continue

        if g.get("download_url"):
            success = download_granule_file(
                g["download_url"],
                dest_file,
                bearer_token=token,
                username=username,
                password=password,
            )
            if success:
                report["downloaded_files"].append(g_name)
            else:
                report["failed_files"].append(g_name)

    # Prune old cache
    prune_old_cache_files(active_dir, max_files=MAX_CACHE_FILES)

    # Calculate total valid files in cache
    valid_cache_files = [
        f for f in os.listdir(active_dir) if is_valid_hdf5_file(os.path.join(active_dir, f))
    ]
    report["total_cached_files"] = len(valid_cache_files)

    if report["downloaded_files"]:
        report["status"] = "SUCCESS"
    elif report["skipped_files"]:
        report["status"] = "UP_TO_DATE"
    elif not has_auth:
        report["status"] = "NO_CREDENTIALS"
    elif report["failed_files"]:
        report["status"] = "FAILED"
    else:
        report["status"] = "NO_GRANULES_FOUND"

    return report


def get_active_gpm_source(custom_cache_dir: Optional[str] = None) -> Optional[str]:
    """
    Returns valid directory containing GPM HDF5 files if present,
    or None if no valid HDF5 files exist.
    """
    cache_dir = get_cache_directory(custom_cache_dir)
    valid_files = [
        f for f in os.listdir(cache_dir) if is_valid_hdf5_file(os.path.join(cache_dir, f))
    ]
    if valid_files:
        return cache_dir
    return None
