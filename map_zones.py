"""
Apada Sathi - Interactive Map Zone Backend Service
===================================================

Transforms analytical hazard results from risk_engine.py and Appwrite
risk_zones into frontend-ready visualization layers for Bhubaneswar.

Key Capabilities:
1. Standardized Map Zones for all 67 BMC Wards & 5 Multi-Hazard layers
2. Exact 4-Tier Severity Color Palette (LOW: #22C55E, MODERATE: #EAB308, HIGH: #F97316, EMERGENCY: #EF4444)
3. Transparent, Deterministic Visualization Radius Calculation (affected_radius_km)
4. Multi-Hazard & Multi-Severity Filter Pipelines
5. Click Quick-Preview & Detailed Inspector Payloads for [View More Details]
6. User Location Threat Evaluation & Notification-Ready Targeting Payloads
7. Seamless Integration with emergency_locations.py (excluding unsafe, full, or closed facilities)

CRITICAL ARCHITECTURAL CONSTRAINTS:
- risk_engine.py is the HEART of the system and is NEVER modified.
- Risk scores, severity thresholds, weights, and formulas are 100% untouched.
- affected_radius_km is strictly an ESTIMATED VISUALIZATION AREA for frontend circle
  rendering and NOT a physical disaster boundary prediction.
- Fully provider-agnostic: does NOT require any Google Maps / Mapbox / Leaflet API keys.
"""

from datetime import datetime, timezone
import math
import os
import threading
import time
from typing import Any, Dict, List, Optional, Set, Tuple, Union
from dotenv import load_dotenv

# Re-use existing risk engine metadata & baselines (READ-ONLY)
import risk_engine
import emergency_locations as el

load_dotenv()

# ==============================================================================
# CONFIGURATION & CONSTANTS
# ==============================================================================

BHUBANESWAR_LAT = risk_engine.BHUBANESWAR_LAT
BHUBANESWAR_LON = risk_engine.BHUBANESWAR_LON
WARD_DATA = risk_engine.WARD_DATA
HAZARDS = risk_engine.HAZARDS
SEVERITY_RANK = risk_engine.SEVERITY_RANK

# Exact Required Severity Palette
SEVERITY_COLORS: Dict[str, str] = {
    "LOW": "#22C55E",        # Green
    "MODERATE": "#EAB308",   # Yellow
    "HIGH": "#F97316",       # Orange
    "EMERGENCY": "#EF4444",   # Red
}

# Base visual radius (km) per hazard type for cartographic display
# Reflects typical geographic scale of meteorological vs hydrological vs local events
HAZARD_BASE_RADIUS_KM: Dict[str, float] = {
    "cyclone": 3.5,          # Wide regional storm footprint
    "heavy_rainfall": 2.5,   # Mesoscale convective rainfall band
    "flood": 2.0,            # Riverine / low-lying drainage sub-basin
    "waterlogging": 1.2,     # Localized urban street / junction depression
    "lightning": 1.5,        # Thunderstorm cloud-to-ground cell footprint
}
DEFAULT_BASE_RADIUS_KM = 1.5

# Multiplier applied to base radius depending on severity tier
SEVERITY_RADIUS_MULTIPLIER: Dict[str, float] = {
    "LOW": 0.70,
    "MODERATE": 0.90,
    "HIGH": 1.15,
    "EMERGENCY": 1.35,
}

# Bounds for map visualization radius (km) to maintain UI readability
MIN_VISUAL_RADIUS_KM = 0.30
MAX_VISUAL_RADIUS_KM = 5.00

# Map Provider Configuration (Safely loaded from environment)
MAP_API_KEY = os.environ.get("MAP_API_KEY", "")


def get_map_provider_config() -> Dict[str, Any]:
    """
    Returns the active Map API provider configuration safely without leaking raw secret keys.
    Detects Google Maps Platform when the key matches Google API key format (starts with 'AIza').
    """
    raw_key = os.environ.get("MAP_API_KEY", "").strip()
    is_valid = bool(raw_key and not raw_key.startswith("PASTE_"))

    if is_valid and raw_key.startswith("AIza"):
        provider = "Google Maps"
    elif is_valid:
        provider = os.environ.get("MAP_PROVIDER", "Custom Provider")
    else:
        provider = os.environ.get("MAP_PROVIDER", "Leaflet / OSM")

    return {
        "provider": provider,
        "configured": is_valid,
        "has_api_key": is_valid,
        "key_present": bool(raw_key),
    }


# ==============================================================================
# VISUALIZATION RADIUS METHODOLOGY
# ==============================================================================

def calculate_affected_radius_km(
    hazard_type: str,
    severity: str,
    risk_score: float = 50.0,
) -> float:
    """
    Computes an estimated visualization radius (in km) for rendering hazard circles
    on the interactive frontend map.

    IMPORTANT:
    This radius is an ESTIMATED VISUALIZATION AREA designed exclusively for frontend
    cartographic display. It is NOT an exact scientific prediction of physical disaster
    boundaries and does NOT alter risk scoring or severity classification.

    Formula:
        base = HAZARD_BASE_RADIUS_KM[hazard_type]
        sev_mult = SEVERITY_RADIUS_MULTIPLIER[severity]
        score_mod = 0.85 + (risk_score / 100.0) * 0.30
        raw_radius = base * sev_mult * score_mod
        affected_radius_km = clamp(raw_radius, 0.30, 5.00)

    Returns:
        float: Estimated affected radius in kilometers rounded to 2 decimal places.
    """
    hazard_key = str(hazard_type).lower().strip()
    base_radius = HAZARD_BASE_RADIUS_KM.get(hazard_key, DEFAULT_BASE_RADIUS_KM)

    sev_key = str(severity).upper().strip()
    sev_multiplier = SEVERITY_RADIUS_MULTIPLIER.get(sev_key, 1.00)

    # Score modulation: scale factor between 0.85 (score=0) and 1.15 (score=100)
    score_clamped = max(0.0, min(100.0, float(risk_score)))
    score_modulation = 0.85 + (score_clamped / 100.0) * 0.30

    estimated_radius = base_radius * sev_multiplier * score_modulation

    # Clamp within legible cartographic boundaries
    final_radius = max(MIN_VISUAL_RADIUS_KM, min(MAX_VISUAL_RADIUS_KM, estimated_radius))
    return round(final_radius, 2)


def get_severity_color(severity: str) -> str:
    """
    Returns the exact standardized hex color code for a severity level.
    """
    sev_key = str(severity).upper().strip()
    return SEVERITY_COLORS.get(sev_key, "#22C55E")


# ==============================================================================
# MAP ZONE BUILDER & STANDARDIZATION
# ==============================================================================

def generate_map_zone_item(
    ward_id: str,
    hazard_type: str,
    risk_score: float,
    severity: str,
    confidence: float,
    ward_name: Optional[str] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    last_updated: Optional[str] = None,
    short_description: Optional[str] = None,
    notify_user: bool = False,
    notification_type: Optional[str] = None,
    show_safe_place: bool = False,
    is_worst_hazard: bool = False,
) -> Dict[str, Any]:
    """
    Constructs a complete, frontend-ready Map Zone entity conforming to all
    required specifications.
    """
    ward_info = WARD_DATA.get(ward_id, {})
    resolved_ward_name = ward_name or ward_info.get("name", ward_id.replace("_", " ").title())
    resolved_lat = lat if lat is not None else ward_info.get("lat", BHUBANESWAR_LAT)
    resolved_lon = lon if lon is not None else ward_info.get("lon", BHUBANESWAR_LON)

    # Calculate deterministic visualization radius
    radius_km = calculate_affected_radius_km(
        hazard_type=hazard_type,
        severity=severity,
        risk_score=risk_score,
    )

    # Resolve standardized severity color
    color = get_severity_color(severity)

    # Generate fallback concise description if not passed
    if not short_description:
        h_title = hazard_type.replace("_", " ").title()
        short_description = (
            f"{h_title} risk is {severity} in {resolved_ward_name} "
            f"(Score: {round(risk_score, 1)}/100, Confidence: {round(confidence)}%)."
        )

    # Timestamp
    if not last_updated:
        last_updated = datetime.now(timezone.utc).isoformat()

    static_layers = ward_info.get("static_layers", {})

    return {
        "ward_id": ward_id,
        "ward_name": resolved_ward_name,
        "hazard_type": hazard_type,
        "latitude": round(float(resolved_lat), 6),
        "longitude": round(float(resolved_lon), 6),
        "risk_score": round(float(risk_score), 1),
        "severity": str(severity).upper(),
        "confidence": round(float(confidence), 1),
        "affected_radius_km": radius_km,
        "color": color,
        "short_description": short_description,
        "last_updated": last_updated,
        # Extended metadata for UI popups, filtering, and notification rules
        "is_worst_hazard": bool(is_worst_hazard),
        "notify_user": bool(notify_user),
        "notification_type": notification_type,
        "show_safe_place": bool(show_safe_place),
        "static_layers": {
            "flood_susceptibility": static_layers.get("flood_susceptibility", 25),
            "waterlogging_susceptibility": static_layers.get("waterlogging_susceptibility", 25),
            "population_exposure": static_layers.get("population_exposure", 50),
        },
    }


def transform_engine_results_to_map_zones(
    all_ward_results: List[Dict[str, Any]],
    worst_hazard_only: bool = False,
) -> List[Dict[str, Any]]:
    """
    Converts full risk_engine.score_all_wards() output list into standardized
    map zone entities.

    If worst_hazard_only is True, returns 1 dominant zone per ward (67 zones).
    If worst_hazard_only is False, returns all 5 hazard layers per ward (335 zones).
    """
    map_zones = []
    now_str = datetime.now(timezone.utc).isoformat()

    for ward in all_ward_results:
        ward_id = ward["ward_id"]
        ward_name = ward.get("ward_name", WARD_DATA.get(ward_id, {}).get("name", ward_id))
        worst_hazard = ward.get("worst_hazard")
        confidence = ward.get("confidence", 80.0)
        notification = ward.get("notification", {})

        hazards = ward.get("hazards", {})
        for hazard_name, hazard_info in hazards.items():
            is_worst = (hazard_name == worst_hazard)

            # Skip non-dominant hazards if single worst-layer requested
            if worst_hazard_only and not is_worst:
                continue

            zone = generate_map_zone_item(
                ward_id=ward_id,
                ward_name=ward_name,
                hazard_type=hazard_name,
                risk_score=hazard_info.get("score", 0.0),
                severity=hazard_info.get("severity", "LOW"),
                confidence=confidence,
                last_updated=now_str,
                notify_user=notification.get("notify_user", False) if is_worst else False,
                notification_type=notification.get("type") if is_worst else None,
                show_safe_place=notification.get("show_safe_place", False) if is_worst else False,
                is_worst_hazard=is_worst,
            )
            map_zones.append(zone)

    return map_zones


# ==============================================================================
# APPWRITE RISK_ZONES DATABASE FETCHER
# ==============================================================================

def fetch_risk_zones_from_db(
    hazard_filter: str = "all",
    severity_filter: Optional[Union[str, List[str]]] = None,
    database_id: str = el.DATABASE_ID,
    table_id: str = "risk_zones",
) -> List[Dict[str, Any]]:
    """
    Queries Appwrite risk_zones table and transforms documents into map zones.
    Falls back gracefully if database connection or credentials are unavailable.
    """
    tdb = el.get_tables_db_service()
    raw_rows = []

    try:
        from appwrite.query import Query

        queries = [Query.limit(500)]
        if hazard_filter and hazard_filter != "all" and hazard_filter in HAZARDS:
            queries.append(Query.equal("hazard_type", hazard_filter))

        if severity_filter:
            if isinstance(severity_filter, str):
                queries.append(Query.equal("severity", severity_filter.upper()))
            elif isinstance(severity_filter, (list, set, tuple)):
                queries.append(Query.equal("severity", [s.upper() for s in severity_filter]))

        response = tdb.list_rows(
            database_id=database_id,
            table_id=table_id,
            queries=queries,
        )
        raw_rows = el.get_items_from_response(response, "rows")
    except Exception as e:
        print(f"Note: fetch_risk_zones_from_db querying Appwrite: {e}")
        return []

    map_zones = []
    for r in raw_rows:
        data = el.normalize_row_data(r)
        ward_id = data.get("ward_id")
        hazard_type = data.get("hazard_type")
        if not ward_id or not hazard_type:
            continue

        zone = generate_map_zone_item(
            ward_id=ward_id,
            ward_name=data.get("ward_name"),
            hazard_type=hazard_type,
            risk_score=data.get("risk_score", 0.0),
            severity=data.get("severity", "LOW"),
            confidence=data.get("confidence", 80.0),
            notify_user=data.get("notify_user", False),
            notification_type=data.get("notification_type"),
            show_safe_place=data.get("show_safe_place", False),
            last_updated=data.get("updated_at") or data.get("created_at"),
        )
        map_zones.append(zone)

    return map_zones


# In-memory thread-safe TTL cache for map zones
_CACHE_LOCK = threading.Lock()
_MAP_ENGINE_RESULTS_CACHE: Dict[str, Any] = {
    "timestamp": 0.0,
    "results": None
}
CACHE_TTL_SECONDS = 300  # 5 minutes cache TTL for web requests


def set_map_zones_cache(engine_results: List[Dict[str, Any]]) -> None:
    """Updates the thread-safe map zones cache with fresh engine results."""
    with _CACHE_LOCK:
        _MAP_ENGINE_RESULTS_CACHE["timestamp"] = time.time()
        _MAP_ENGINE_RESULTS_CACHE["results"] = engine_results


def _get_cached_engine_results() -> List[Dict[str, Any]]:
    """Retrieves cached engine results if within TTL, else calculates fresh results."""
    with _CACHE_LOCK:
        now = time.time()
        ts = _MAP_ENGINE_RESULTS_CACHE.get("timestamp", 0.0)
        res = _MAP_ENGINE_RESULTS_CACHE.get("results")
        if res is not None and (now - ts) < CACHE_TTL_SECONDS:
            return res

    try:
        engine_results = risk_engine.score_all_wards()
        if engine_results:
            set_map_zones_cache(engine_results)
            return engine_results
    except Exception as e:
        print(f"Warning: risk_engine.score_all_wards failed: {e}")
        with _CACHE_LOCK:
            stale_res = _MAP_ENGINE_RESULTS_CACHE.get("results")
            if stale_res is not None:
                return stale_res

    return []


# ==============================================================================
# MAIN MAP ZONES QUERY & FILTER PIPELINE
# ==============================================================================

def get_map_zones(
    source: str = "engine",
    hazard_filter: str = "all",
    severity_filter: Optional[Union[str, List[str]]] = None,
    min_score: Optional[float] = None,
    ward_id: Optional[str] = None,
    worst_hazard_only: bool = False,
    precomputed_results: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """
    Primary backend endpoint to retrieve interactive map hazard zones for Bhubaneswar.

    Parameters:
        source: 'engine' (evaluates live engine), 'db' (reads Appwrite risk_zones),
                or 'data' (uses precomputed_results).
        hazard_filter: 'all' or one of ['heavy_rainfall', 'flood', 'waterlogging', 'lightning', 'cyclone']
        severity_filter: Single string or list of severities ('LOW', 'MODERATE', 'HIGH', 'EMERGENCY')
        min_score: Optional minimum risk score filter (0-100)
        ward_id: Optional specific ward filter (e.g. 'ward_12')
        worst_hazard_only: If True, returns only dominant hazard per ward (67 zones)
        precomputed_results: Optional list of ward results from risk_engine.score_all_wards()

    Returns:
        List of standardized map zone dictionaries.
    """
    zones: List[Dict[str, Any]] = []

    # 1. Source acquisition
    if precomputed_results is not None:
        zones = transform_engine_results_to_map_zones(
            precomputed_results,
            worst_hazard_only=worst_hazard_only,
        )
    elif source == "db":
        db_zones = fetch_risk_zones_from_db(
            hazard_filter=hazard_filter,
            severity_filter=severity_filter,
        )
        if db_zones:
            zones = db_zones
        else:
            # Fallback to engine if DB is empty / offline
            engine_results = _get_cached_engine_results()
            zones = transform_engine_results_to_map_zones(
                engine_results,
                worst_hazard_only=worst_hazard_only,
            )
    else:
        # Default: evaluate via risk_engine.py with in-memory TTL caching
        engine_results = _get_cached_engine_results()
        zones = transform_engine_results_to_map_zones(
            engine_results,
            worst_hazard_only=worst_hazard_only,
        )

    # 2. Hazard filtering
    if hazard_filter and hazard_filter != "all":
        h_filter_lower = hazard_filter.lower().strip()
        zones = [z for z in zones if z["hazard_type"] == h_filter_lower]

    # 3. Severity filtering
    if severity_filter:
        if isinstance(severity_filter, str):
            allowed_sevs = {severity_filter.upper().strip()}
        else:
            allowed_sevs = {str(s).upper().strip() for s in severity_filter}
        zones = [z for z in zones if z["severity"] in allowed_sevs]

    # 4. Minimum score filtering
    if min_score is not None:
        min_val = float(min_score)
        zones = [z for z in zones if z["risk_score"] >= min_val]

    # 5. Ward ID filtering
    if ward_id:
        w_filter = ward_id.lower().strip()
        zones = [z for z in zones if z["ward_id"] == w_filter]

    return zones


# ==============================================================================
# MAP CLICK INFORMATION & INSPECTOR
# ==============================================================================

def get_zone_preview(
    ward_id: str,
    hazard_type: Optional[str] = None,
    precomputed_results: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Lightweight popup preview when a user taps/clicks any zone on the map.
    """
    zones = get_map_zones(
        hazard_filter=hazard_type or "all",
        ward_id=ward_id,
        precomputed_results=precomputed_results,
    )
    if not zones:
        ward_info = WARD_DATA.get(ward_id, {})
        return {
            "ward_id": ward_id,
            "ward_name": ward_info.get("name", ward_id),
            "status": "NO_DATA",
            "message": "No active hazard data recorded for this zone.",
        }

    # Select requested hazard or dominant worst hazard
    selected_zone = None
    if hazard_type:
        for z in zones:
            if z["hazard_type"] == hazard_type:
                selected_zone = z
                break
    if not selected_zone:
        # Default to highest risk score
        selected_zone = max(zones, key=lambda z: z["risk_score"])

    return {
        "ward_id": selected_zone["ward_id"],
        "ward_name": selected_zone["ward_name"],
        "hazard_type": selected_zone["hazard_type"],
        "severity": selected_zone["severity"],
        "risk_score": selected_zone["risk_score"],
        "confidence": selected_zone["confidence"],
        "affected_radius_km": selected_zone["affected_radius_km"],
        "color": selected_zone["color"],
        "latitude": selected_zone["latitude"],
        "longitude": selected_zone["longitude"],
        "short_description": selected_zone["short_description"],
        "last_updated": selected_zone["last_updated"],
        "action_cta": "View More Details",
    }


def get_zone_details(
    ward_id: str,
    hazard_type: Optional[str] = None,
    precomputed_results: Optional[List[Dict[str, Any]]] = None,
    include_safe_places: bool = True,
) -> Dict[str, Any]:
    """
    Full comprehensive inspector payload for the "[View More Details]" modal/screen.
    Includes:
    - Selected hazard details
    - Complete 5-hazard breakdown for the ward
    - Static susceptibility & population exposure
    - Safe places near the ward (excluding hazardous/full/closed places)
    """
    all_ward_zones = get_map_zones(
        hazard_filter="all",
        ward_id=ward_id,
        precomputed_results=precomputed_results,
    )

    if not all_ward_zones:
        ward_info = WARD_DATA.get(ward_id, {})
        return {"error": f"Ward '{ward_id}' not found."}

    # Identify primary hazard
    primary_zone = None
    if hazard_type:
        for z in all_ward_zones:
            if z["hazard_type"] == hazard_type:
                primary_zone = z
                break
    if not primary_zone:
        primary_zone = max(all_ward_zones, key=lambda z: z["risk_score"])

    # Multi-hazard breakdown dict
    hazard_breakdown = {
        z["hazard_type"]: {
            "score": z["risk_score"],
            "severity": z["severity"],
            "color": z["color"],
            "affected_radius_km": z["affected_radius_km"],
        }
        for z in all_ward_zones
    }

    # Safe places query
    safe_places = []
    if include_safe_places:
        try:
            safe_places = el.find_safe_emergency_locations(
                user_lat=primary_zone["latitude"],
                user_lon=primary_zone["longitude"],
                hazard_type=primary_zone["hazard_type"],
                max_results=5,
            )
        except Exception as e:
            print(f"Note: safe places query in get_zone_details: {e}")

    return {
        "ward_id": primary_zone["ward_id"],
        "ward_name": primary_zone["ward_name"],
        "primary_hazard": primary_zone["hazard_type"],
        "severity": primary_zone["severity"],
        "risk_score": primary_zone["risk_score"],
        "confidence": primary_zone["confidence"],
        "affected_radius_km": primary_zone["affected_radius_km"],
        "color": primary_zone["color"],
        "latitude": primary_zone["latitude"],
        "longitude": primary_zone["longitude"],
        "short_description": primary_zone["short_description"],
        "last_updated": primary_zone["last_updated"],
        "notification_rule": {
            "notify_user": primary_zone["notify_user"],
            "notification_type": primary_zone["notification_type"],
            "show_safe_place": primary_zone["show_safe_place"],
        },
        "hazard_breakdown": hazard_breakdown,
        "static_layers": primary_zone["static_layers"],
        "nearby_safe_places": safe_places,
    }


# ==============================================================================
# LOCATION-BASED TARGETING & USER THREAT EVALUATION
# ==============================================================================

def find_nearest_ward(lat: float, lon: float) -> Tuple[str, float]:
    """
    Finds the closest BMC ward center to the given coordinates.
    Returns: (ward_id, distance_km)
    """
    closest_ward = "ward_1"
    min_dist = float("inf")

    for w_id, w_data in WARD_DATA.items():
        w_lat = w_data.get("lat")
        w_lon = w_data.get("lon")
        if w_lat is None or w_lon is None:
            continue
        dist = el.haversine_distance(lat, lon, w_lat, w_lon)
        if dist < min_dist:
            min_dist = dist
            closest_ward = w_id

    return closest_ward, min_dist


def evaluate_user_location(
    user_lat: float,
    user_lon: float,
    hazard_type: Optional[str] = None,
    precomputed_results: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Evaluates whether a user's location is inside or near an active hazard zone.
    Prepares complete data package for the future push/SMS notification targeting module.

    Logic:
    1. Determines closest BMC ward and distance.
    2. Retrieves current risk status for that ward.
    3. Checks if user distance <= estimated affected_radius_km.
    4. Evaluates notification eligibility (HIGH or EMERGENCY severity).
    5. Discovers nearby verified safe places using emergency_locations.py.

    Returns:
        Notification-ready user targeting dictionary.
    """
    closest_ward_id, dist_to_ward_km = find_nearest_ward(user_lat, user_lon)
    ward_zones = get_map_zones(
        hazard_filter=hazard_type or "all",
        ward_id=closest_ward_id,
        precomputed_results=precomputed_results,
    )

    if not ward_zones:
        return {
            "user_location": {"latitude": user_lat, "longitude": user_lon},
            "ward_id": closest_ward_id,
            "ward_name": WARD_DATA.get(closest_ward_id, {}).get("name", closest_ward_id),
            "is_affected": False,
            "severity": "LOW",
            "message": "User is in a safe, low-risk area.",
            "safe_places": [],
        }

    # Evaluate worst hazard or requested hazard
    if hazard_type:
        target_zone = next((z for z in ward_zones if z["hazard_type"] == hazard_type), ward_zones[0])
    else:
        target_zone = max(ward_zones, key=lambda z: z["risk_score"])

    radius_km = target_zone["affected_radius_km"]
    in_radius = dist_to_ward_km <= radius_km
    severity = target_zone["severity"]
    risk_score = target_zone["risk_score"]

    # Notification rules: HIGH or EMERGENCY severity constitutes active danger
    is_threat = severity in ("HIGH", "EMERGENCY")
    is_affected = in_radius and is_threat

    # Alert message synthesis
    h_label = target_zone["hazard_type"].replace("_", " ").title()
    if is_threat:
        alert_msg = (
            f"URGENT ALERT: High risk of {h_label} detected in {target_zone['ward_name']}. "
            f"You are approximately {dist_to_ward_km:.2f} km from the hazard center. "
            f"Please proceed to the nearest designated safe place if required."
        )
    elif severity == "MODERATE":
        alert_msg = (
            f"ADVISORY: Moderate {h_label} conditions observed in {target_zone['ward_name']}. "
            f"Stay alert and monitor local updates."
        )
    else:
        alert_msg = f"Conditions in {target_zone['ward_name']} are currently LOW risk."

    # Fetch safe emergency locations (excluding active hazard ward)
    safe_places = []
    if target_zone["show_safe_place"] or is_threat:
        try:
            # Active affected wards set for safety filtering
            affected_set = {closest_ward_id} if is_threat else set()
            safe_places = el.find_safe_emergency_locations(
                user_lat=user_lat,
                user_lon=user_lon,
                hazard_type=target_zone["hazard_type"],
                affected_zones=affected_set,
                max_results=5,
            )
        except Exception as e:
            print(f"Note: safe places query in evaluate_user_location: {e}")

    return {
        "user_location": {"latitude": round(user_lat, 6), "longitude": round(user_lon, 6)},
        "ward_id": target_zone["ward_id"],
        "ward_name": target_zone["ward_name"],
        "hazard_type": target_zone["hazard_type"],
        "severity": severity,
        "risk_score": risk_score,
        "confidence": target_zone["confidence"],
        "color": target_zone["color"],
        "distance_from_center_km": round(dist_to_ward_km, 2),
        "affected_radius_km": radius_km,
        "is_inside_hazard_radius": in_radius,
        "is_affected": is_affected,
        "notification_eligible": is_threat,
        "notification_type": target_zone["notification_type"],
        "alert_message": alert_msg,
        "safe_places_available": len(safe_places) > 0,
        "nearest_safe_places": safe_places,
    }


# ==============================================================================
# SAFE PLACES MAP LAYER (INTEGRATION WITH EMERGENCY_LOCATIONS.PY)
# ==============================================================================

def get_safe_places_map_layer(
    hazard_type: Optional[str] = None,
    user_lat: Optional[float] = None,
    user_lon: Optional[float] = None,
    max_radius_km: float = 30.0,
    precomputed_results: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """
    Generates the official "Safe Places Near Me" map layer for frontend rendering.

    Safety Guarantees:
    1. Identifies all wards currently in HIGH or EMERGENCY severity.
    2. EXCLUDES any emergency location physically located inside those affected wards.
    3. EXCLUDES CLOSED locations.
    4. EXCLUDES FULL locations (where available capacity <= 0).
    5. Returns safe locations formatted as frontend map pins.
    """
    # 1. Identify active high/emergency risk wards
    affected_wards: Set[str] = set()
    try:
        zones = get_map_zones(
            hazard_filter=hazard_type or "all",
            severity_filter=["HIGH", "EMERGENCY"],
            precomputed_results=precomputed_results,
        )
        for z in zones:
            affected_wards.add(z["ward_id"])
    except Exception as e:
        print(f"Note: error resolving affected wards for safe places layer: {e}")

    # Center coordinates for distance calculation
    ref_lat = user_lat if user_lat is not None else BHUBANESWAR_LAT
    ref_lon = user_lon if user_lon is not None else BHUBANESWAR_LON

    # 2. Query safe locations from emergency_locations.py
    safe_list = el.find_safe_emergency_locations(
        user_lat=ref_lat,
        user_lon=ref_lon,
        hazard_type=hazard_type,
        affected_zones=affected_wards,
        max_results=50,
        max_radius_km=max_radius_km,
    )

    # 3. Format as frontend map layer pins
    safe_place_pins = []
    for loc in safe_list:
        loc_type = loc.get("type", "other")
        safe_place_pins.append({
            "layer_type": "official_safe_place",
            "id": loc.get("id"),
            "name": loc.get("name"),
            "type": loc_type,
            "latitude": loc.get("latitude"),
            "longitude": loc.get("longitude"),
            "address": loc.get("address", ""),
            "ward_id": loc.get("ward_id"),
            "distance_km": loc.get("distance_km"),
            "status": loc.get("status", "ACTIVE"),
            "capacity": loc.get("capacity"),
            "available_capacity": loc.get("available_capacity"),
            "is_government_verified": loc.get("is_government_verified", False),
            "safety_status": "SAFE",
            "pin_color": "#10B981" if loc.get("is_government_verified") else "#06B6D4",
        })

    return safe_place_pins
