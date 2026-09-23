"""
NASA GPM IMERG V07 Satellite Precipitation Extractor
====================================================
Apada Sathi / NivaranAI Backend Module

Provides reusable ingestion and grid cell extraction for NASA GPM IMERG
half-hourly HDF5 precipitation data (3B-HHR / GPM_3IMERGHHE).

Grid Structure:
  Grid/lon           : (3600,) float32 [-179.95 to 179.95, 0.1 deg step]
  Grid/lat           : (1800,) float32 [-89.95 to 89.95, 0.1 deg step]
  Grid/precipitation : (1, 3600, 1800) float32 [mm/hr]
  Missing Value      : -9999.9

This module does not contain hardcoded local user paths or risk-engine scoring formulas.
"""

import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import h5py

MISSING_VALUE_THRESHOLD = -9000.0


def parse_timestamp_from_filename(filename: str) -> Optional[str]:
    """
    Parses start timestamp from GPM filename.
    Example: 3B-HHR-E.MS.MRG.3IMERG.20260923-S043000-E045959.0270.V07C.HDF5
    Returns ISO 8601 string: '2026-09-23T04:30:00Z'
    """
    basename = os.path.basename(filename)
    match = re.search(r"(\d{8})-S(\d{6})", basename)
    if match:
        date_str, time_str = match.groups()
        try:
            dt = datetime.strptime(f"{date_str}{time_str}", "%Y%m%d%H%M%S").replace(
                tzinfo=timezone.utc
            )
            return dt.isoformat().replace("+00:00", "Z")
        except ValueError:
            pass
    return None


def parse_timestamp_from_hdf5(h5_file: h5py.File) -> Optional[str]:
    """
    Fallback timestamp extraction from Grid/time dataset attributes or values.
    GPM epoch starts at 1980-01-06 00:00:00 UTC.
    """
    try:
        if "Grid" in h5_file and "time" in h5_file["Grid"]:
            t_dataset = h5_file["Grid"]["time"]
            seconds_since_1980 = float(t_dataset[0])
            # GPM GPS time origin: 1980-01-06 00:00:00 UTC
            epoch_start = datetime(1980, 1, 6, 0, 0, 0, tzinfo=timezone.utc).timestamp()
            dt = datetime.fromtimestamp(epoch_start + seconds_since_1980, tz=timezone.utc)
            return dt.isoformat().replace("+00:00", "Z")
    except Exception:
        pass
    return None


def find_nearest_grid_indices(
    lons: np.ndarray, lats: np.ndarray, target_lon: float, target_lat: float
) -> Tuple[int, int]:
    """
    Returns (lon_index, lat_index) for the nearest grid cell to (target_lon, target_lat).
    """
    lon_idx = int(np.argmin(np.abs(lons - target_lon)))
    lat_idx = int(np.argmin(np.abs(lats - target_lat)))
    return lon_idx, lat_idx


def extract_single_file(
    file_path: str, target_lat: float, target_lon: float
) -> Dict[str, Any]:
    """
    Extracts GPM precipitation for a single HDF5 file at the target (lat, lon).
    Returns structured observation dict.
    """
    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"GPM HDF5 file not found: {file_path}")

    timestamp = parse_timestamp_from_filename(file_path)

    with h5py.File(file_path, "r") as h5f:
        if "Grid" not in h5f:
            raise KeyError(f"Invalid GPM HDF5 format: 'Grid' group missing in {file_path}")

        grid = h5f["Grid"]
        lons = grid["lon"][:]
        lats = grid["lat"][:]

        if not timestamp:
            timestamp = parse_timestamp_from_hdf5(h5f)

        lon_idx, lat_idx = find_nearest_grid_indices(lons, lats, target_lon, target_lat)
        matched_lon = float(lons[lon_idx])
        matched_lat = float(lats[lat_idx])

        raw_precip = grid["precipitation"][0, lon_idx, lat_idx]

        if raw_precip is None or raw_precip < MISSING_VALUE_THRESHOLD:
            precip_value = None
        else:
            precip_value = round(float(raw_precip), 4)

    return {
        "source": "NASA_GPM_IMERG",
        "product": "GPM_3IMERGHHE",
        "version": "07",
        "latitude": target_lat,
        "longitude": target_lon,
        "matched_grid_latitude": round(matched_lat, 4),
        "matched_grid_longitude": round(matched_lon, 4),
        "timestamp": timestamp,
        "precipitation_mm_hr": precip_value,
        "unit": "mm/hr",
        "file_name": os.path.basename(file_path),
    }


def extract_gpm_precipitation(
    source: Union[str, List[str]], target_lat: float, target_lon: float
) -> List[Dict[str, Any]]:
    """
    Extracts GPM precipitation observations for a given target (lat, lon) across
    a single file, list of files, or directory of HDF5 files.

    Returns a list of structured observation dictionaries sorted chronologically.
    """
    file_list: List[str] = []

    if isinstance(source, list):
        file_list = [f for f in source if f.endswith((".hdf5", ".HDF5", ".h5", ".H5"))]
    elif os.path.isdir(source):
        file_list = [
            os.path.join(source, f)
            for f in os.listdir(source)
            if f.endswith((".hdf5", ".HDF5", ".h5", ".H5"))
        ]
    elif os.path.isfile(source):
        file_list = [source]

    file_list.sort()

    observations = []
    for file_path in file_list:
        try:
            obs = extract_single_file(file_path, target_lat, target_lon)
            observations.append(obs)
        except Exception as e:
            print(f"Warning: Failed to extract GPM data from {file_path}: {e}")

    observations.sort(key=lambda x: x.get("timestamp") or "")
    return observations


def extract_gpm_for_wards(
    source: Union[str, List[str]], ward_data: Optional[Dict[str, Any]] = None
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Extracts GPM precipitation observations for all ward centroids in ward_data.
    If ward_data is not provided, attempts to import WARD_DATA from risk_engine.

    Returns dict mapping ward_id -> list of observation records across files.
    """
    if ward_data is None:
        try:
            import risk_engine
            ward_data = risk_engine.WARD_DATA
        except ImportError:
            raise ValueError(
                "ward_data was not provided and risk_engine.WARD_DATA could not be imported."
            )

    file_list: List[str] = []
    if isinstance(source, list):
        file_list = [f for f in source if f.endswith((".hdf5", ".HDF5", ".h5", ".H5"))]
    elif os.path.isdir(source):
        file_list = [
            os.path.join(source, f)
            for f in os.listdir(source)
            if f.endswith((".hdf5", ".HDF5", ".h5", ".H5"))
        ]
    elif os.path.isfile(source):
        file_list = [source]

    file_list.sort()
    ward_results: Dict[str, List[Dict[str, Any]]] = {w_id: [] for w_id in ward_data}

    for file_path in file_list:
        if not os.path.isfile(file_path):
            continue
        timestamp = parse_timestamp_from_filename(file_path)

        with h5py.File(file_path, "r") as h5f:
            if "Grid" not in h5f:
                continue
            grid = h5f["Grid"]
            lons = grid["lon"][:]
            lats = grid["lat"][:]
            precip_grid = grid["precipitation"][0]  # shape: (3600, 1800)

            if not timestamp:
                timestamp = parse_timestamp_from_hdf5(h5f)

            for ward_id, ward_info in ward_data.items():
                w_lat = ward_info["lat"]
                w_lon = ward_info["lon"]
                lon_idx, lat_idx = find_nearest_grid_indices(lons, lats, w_lon, w_lat)

                raw_val = precip_grid[lon_idx, lat_idx]
                if raw_val is None or raw_val < MISSING_VALUE_THRESHOLD:
                    precip_val = None
                else:
                    precip_val = round(float(raw_val), 4)

                record = {
                    "source": "NASA_GPM_IMERG",
                    "product": "GPM_3IMERGHHE",
                    "version": "07",
                    "ward_id": ward_id,
                    "ward_name": ward_info.get("name", ward_id),
                    "latitude": w_lat,
                    "longitude": w_lon,
                    "matched_grid_latitude": round(float(lats[lat_idx]), 4),
                    "matched_grid_longitude": round(float(lons[lon_idx]), 4),
                    "timestamp": timestamp,
                    "precipitation_mm_hr": precip_val,
                    "unit": "mm/hr",
                    "file_name": os.path.basename(file_path),
                }
                ward_results[ward_id].append(record)

    for ward_id in ward_results:
        ward_results[ward_id].sort(key=lambda x: x.get("timestamp") or "")

    return ward_results
