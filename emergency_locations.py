"""
Apada Sathi - Dynamic Emergency Location / Safe-Place Backend Service

Provides backend support for:
1. Permanent emergency locations (hospitals, police stations, fire stations, official shelters, relief centres)
2. Temporary emergency disaster camps created & managed by authorized government officials
3. Safety-First safe-place lookup: evaluating locations against active hazard zones before ranking by distance
4. Haversine geographic distance calculation
5. Full Appwrite TablesDB integration using existing credentials

CRITICAL ARCHITECTURE NOTE:
This module operates in conjunction with risk_engine.py without modifying any of its
formulas, weights, thresholds, or data baselines.
"""

import math
import os
from typing import Any, Dict, List, Optional, Tuple, Union
from dotenv import load_dotenv

load_dotenv()

# ==============================================================================
# CONFIGURATION & CONSTANTS
# ==============================================================================

APPWRITE_ENDPOINT = os.environ.get("APPWRITE_ENDPOINT", "https://sgp.cloud.appwrite.io/v1")
APPWRITE_PROJECT_ID = os.environ.get("APPWRITE_PROJECT_ID", "6a842a71002b825e7612")
APPWRITE_API_KEY = os.environ.get("APPWRITE_API_KEY")
DATABASE_ID = os.environ.get("APPWRITE_DATABASE_ID", "6a842ad90015884d7d96")
TABLE_ID = "emergency_locations"

VALID_LOCATION_TYPES = {
    "hospital",
    "police_station",
    "fire_station",
    "official_shelter",
    "government_camp",
    "relief_centre",
    "other",
}

VALID_STATUSES = {"ACTIVE", "FULL", "CLOSED"}

VALID_HAZARDS = {"heavy_rainfall", "flood", "waterlogging", "lightning", "cyclone"}

EARTH_RADIUS_KM = 6371.0088  # WGS-84 mean Earth radius


# ==============================================================================
# APPWRITE CLIENT & SCHEMA MANAGEMENT
# ==============================================================================

def get_appwrite_client():
    """Initializes and returns an authenticated Appwrite Client."""
    from appwrite.client import Client

    client = Client()
    client.set_endpoint(APPWRITE_ENDPOINT)
    client.set_project(APPWRITE_PROJECT_ID)
    if APPWRITE_API_KEY:
        client.set_key(APPWRITE_API_KEY)
    return client


def get_tables_db_service(client=None):
    """Returns the Appwrite TablesDB service instance."""
    from appwrite.services.tables_db import TablesDB

    if client is None:
        client = get_appwrite_client()
    return TablesDB(client)


def get_items_from_response(response: Any, key: str) -> list:
    """Safely extracts item list from Appwrite models or dictionary responses."""
    if hasattr(response, key):
        val = getattr(response, key)
        return val if val is not None else []
    if isinstance(response, dict):
        return response.get(key, [])
    return []


def ensure_schema(database_id: str = DATABASE_ID, table_id: str = TABLE_ID) -> Dict[str, Any]:
    """
    Programmatically verifies and creates the emergency_locations table,
    its 12 columns, and query indexes on Appwrite TablesDB if they do not exist.
    """
    from appwrite.permission import Permission
    from appwrite.role import Role
    from appwrite.enums.tables_db_index_type import TablesDBIndexType

    tdb = get_tables_db_service()

    # 1. Verify or create table
    try:
        table = tdb.get_table(database_id=database_id, table_id=table_id)
    except Exception:
        table = tdb.create_table(
            database_id=database_id,
            table_id=table_id,
            name=table_id,
            permissions=[Permission.read(Role.any())],
            row_security=False,
            enabled=True,
        )

    # 2. List existing columns
    existing_cols_resp = tdb.list_columns(database_id=database_id, table_id=table_id)
    existing_col_keys = {
        getattr(c, "key", None) or (c.get("key") if isinstance(c, dict) else None)
        for c in get_items_from_response(existing_cols_resp, "columns")
    }

    # 3. Required column definitions
    columns_to_create = [
        ("name", "varchar", {"size": 255, "required": True}),
        ("type", "varchar", {"size": 50, "required": True}),
        ("latitude", "float", {"required": True}),
        ("longitude", "float", {"required": True}),
        ("address", "varchar", {"size": 500, "required": False}),
        ("ward_id", "varchar", {"size": 50, "required": False}),
        ("status", "varchar", {"size": 20, "required": True}),
        ("capacity", "integer", {"required": False}),
        ("available_capacity", "integer", {"required": False}),
        ("hazard_type", "varchar", {"size": 50, "required": False}),
        ("created_by", "varchar", {"size": 100, "required": False}),
        ("is_government_verified", "boolean", {"required": True}),
    ]

    for col_key, col_type, col_kwargs in columns_to_create:
        if col_key not in existing_col_keys:
            try:
                if col_type == "varchar":
                    tdb.create_varchar_column(
                        database_id=database_id,
                        table_id=table_id,
                        key=col_key,
                        size=col_kwargs["size"],
                        required=col_kwargs["required"],
                    )
                elif col_type == "float":
                    tdb.create_float_column(
                        database_id=database_id,
                        table_id=table_id,
                        key=col_key,
                        required=col_kwargs["required"],
                    )
                elif col_type == "integer":
                    tdb.create_integer_column(
                        database_id=database_id,
                        table_id=table_id,
                        key=col_key,
                        required=col_kwargs["required"],
                    )
                elif col_type == "boolean":
                    tdb.create_boolean_column(
                        database_id=database_id,
                        table_id=table_id,
                        key=col_key,
                        required=col_kwargs["required"],
                    )
            except Exception as e:
                print(f"Note on creating column '{col_key}': {e}")

    # 4. Create helpful query indexes
    try:
        existing_indexes = tdb.list_indexes(database_id=database_id, table_id=table_id)
        existing_idx_keys = {
            getattr(idx, "key", None) or (idx.get("key") if isinstance(idx, dict) else None)
            for idx in get_items_from_response(existing_indexes, "indexes")
        }
        if "idx_status" not in existing_idx_keys:
            tdb.create_index(database_id, table_id, key="idx_status", type=TablesDBIndexType.KEY, columns=["status"])
        if "idx_ward" not in existing_idx_keys:
            tdb.create_index(database_id, table_id, key="idx_ward", type=TablesDBIndexType.KEY, columns=["ward_id"])
        if "idx_type" not in existing_idx_keys:
            tdb.create_index(database_id, table_id, key="idx_type", type=TablesDBIndexType.KEY, columns=["type"])
    except Exception as e:
        print(f"Note on creating indexes: {e}")

    return {"status": "ok", "table_id": table_id}


# ==============================================================================
# DISTANCE CALCULATION (HAVERSINE FORMULA)
# ==============================================================================

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates great-circle distance between two coordinate pairs on Earth
    using the spherical Haversine formula.

    Returns:
        Distance in kilometers (km), rounded to 2 decimal places.
    """
    if None in (lat1, lon1, lat2, lon2):
        return float("inf")

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    # Clip numerical inaccuracies
    a = max(0.0, min(1.0, a))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance = EARTH_RADIUS_KM * c

    return round(distance, 2)


# ==============================================================================
# SAFETY-FIRST ZONE FILTERING
# ==============================================================================

def normalize_row_data(row: Any) -> Dict[str, Any]:
    """Extracts a clean dictionary from an Appwrite Row model, dict, or object."""
    if isinstance(row, dict):
        data = row.get("data", row)
        doc_id = row.get("$id", row.get("id", data.get("$id", data.get("id"))))
    elif hasattr(row, "data") and isinstance(row.data, dict):
        data = dict(row.data)
        doc_id = getattr(row, "id", getattr(row, "$id", None))
    elif hasattr(row, "to_dict"):
        d = row.to_dict()
        data = d.get("data", d)
        doc_id = getattr(row, "id", getattr(row, "$id", None))
    else:
        data = {}
        for attr in [
            "name", "type", "latitude", "longitude", "address", "ward_id",
            "status", "capacity", "available_capacity", "hazard_type",
            "created_by", "is_government_verified"
        ]:
            if hasattr(row, attr):
                data[attr] = getattr(row, attr)
        doc_id = getattr(row, "id", getattr(row, "$id", None))

    data["$id"] = doc_id
    data["id"] = doc_id

    # Capacity & Occupancy coercions and schema alignment
    tot = data.get("total_capacity")
    if tot is None:
        tot = data.get("capacity")
    try:
        tot = int(tot) if tot is not None else 0
    except (ValueError, TypeError):
        tot = 0

    avail = data.get("available_capacity")
    if avail is None:
        avail = data.get("available_beds")
    try:
        avail = int(avail) if avail is not None else tot
    except (ValueError, TypeError):
        avail = tot

    occ = data.get("occupied_capacity")
    if occ is None:
        occ = max(0, tot - avail)
    else:
        try:
            occ = int(occ)
        except (ValueError, TypeError):
            occ = max(0, tot - avail)

    data["capacity"] = tot
    data["total_capacity"] = tot
    data["available_capacity"] = avail
    data["available_beds"] = avail
    data["occupied_capacity"] = occ

    if "is_government_verified" in data:
        data["is_government_verified"] = bool(data["is_government_verified"])

    return data


def fetch_active_hazard_wards_from_db(
    hazard_type: Optional[str] = None,
    database_id: str = DATABASE_ID,
) -> set:
    """
    Fetches wards from the Appwrite risk_zones table that are currently flagged
    as HIGH or EMERGENCY severity.
    """
    from appwrite.query import Query

    tdb = get_tables_db_service()
    high_risk_wards = set()

    try:
        queries = [
            Query.equal("severity", ["HIGH", "EMERGENCY"]),
            Query.limit(100),
        ]
        if hazard_type and hazard_type in VALID_HAZARDS:
            queries.append(Query.equal("hazard_type", hazard_type))

        response = tdb.list_rows(
            database_id=database_id,
            table_id="risk_zones",
            queries=queries,
        )
        rows = get_items_from_response(response, "rows")
        for row in rows:
            data = normalize_row_data(row)
            ward_id = data.get("ward_id")
            if ward_id:
                high_risk_wards.add(ward_id)
    except Exception as e:
        print(f"Warning: could not fetch active risk zones from DB: {e}")

    return high_risk_wards


def is_location_safe(
    location: Dict[str, Any],
    affected_zones: Optional[Union[set, list, dict]] = None,
    current_hazard: Optional[str] = None,
) -> Tuple[bool, str]:
    """
    Determines whether an emergency location is safe and eligible for routing.

    Safety Rules:
    1. EXCLUDE CLOSED locations (status == 'CLOSED').
    2. EXCLUDE FULL locations when capacity information indicates no vacancy
       (status == 'FULL' or available_capacity <= 0).
    3. EXCLUDE locations inside the active hazard / affected zone.

    Returns:
        (is_safe: bool, reason: str)
    """
    # 1. Check status
    status = str(location.get("status", "ACTIVE")).upper()
    if status == "CLOSED":
        return False, "Location is CLOSED"

    # 2. Check capacity
    if status == "FULL":
        return False, "Location is FULL"

    available_cap = location.get("available_capacity")
    if available_cap is not None and available_cap <= 0:
        return False, "No available capacity (0 spots remaining)"

    # 3. Check hazard type match (if camp is hazard-specific)
    loc_hazard = location.get("hazard_type")
    if loc_hazard and current_hazard and loc_hazard not in ("all", "any", "general", current_hazard):
        # If the facility is exclusively dedicated to a different disaster type
        pass

    # 4. Check affected / hazard risk zones
    ward_id = location.get("ward_id")
    if affected_zones is not None:
        if isinstance(affected_zones, (set, list, tuple)):
            if ward_id and ward_id in affected_zones:
                return False, f"Location is inside active hazard zone ({ward_id})"
        elif isinstance(affected_zones, dict):
            # Dict mapping ward_id -> info (e.g. { "ward_2": {"severity": "HIGH", ...} })
            if ward_id and ward_id in affected_zones:
                ward_info = affected_zones[ward_id]
                if isinstance(ward_info, dict):
                    sev = str(ward_info.get("severity", "")).upper()
                    if sev in ("HIGH", "EMERGENCY"):
                        return False, f"Location ward ({ward_id}) has {sev} severity"
                    # Check specific hazard severity if available
                    hazards = ward_info.get("hazards", {})
                    if current_hazard and current_hazard in hazards:
                        h_sev = str(hazards[current_hazard].get("severity", "")).upper()
                        if h_sev in ("HIGH", "EMERGENCY"):
                            return False, f"Location ward ({ward_id}) has {h_sev} severity for {current_hazard}"
                elif str(ward_info).upper() in ("HIGH", "EMERGENCY", "AFFECTED", "UNSAFE"):
                    return False, f"Location ward ({ward_id}) is flagged as unsafe"

    return True, "Safe and eligible"


# ==============================================================================
# DYNAMIC SAFE-PLACE LOOKUP
# ==============================================================================

def find_safe_emergency_locations(
    user_lat: float,
    user_lon: float,
    hazard_type: Optional[str] = None,
    affected_zones: Optional[Union[set, list, dict]] = None,
    max_results: int = 10,
    max_radius_km: float = 50.0,
    preferred_types: Optional[List[str]] = None,
    database_id: str = DATABASE_ID,
    table_id: str = TABLE_ID,
) -> List[Dict[str, Any]]:
    """
    Finds and ranks safe emergency locations for a user or ward center.

    Safety-First Workflow:
    1. Fetches candidate emergency locations from Appwrite TablesDB.
    2. Identifies active affected/hazard zones (from risk_zones DB if not passed).
    3. EXCLUDES locations inside active hazard zones.
    4. EXCLUDES CLOSED locations.
    5. EXCLUDES FULL locations.
    6. Calculates Haversine distance from the user/alert location.
    7. Ranks safe locations by distance with preference for government-verified facilities.
    8. Returns top suitable safe locations.

    Returns:
        List of dicts representing safe emergency locations with distance_km.
    """
    # 1. Resolve affected zones if not supplied
    if affected_zones is None:
        affected_zones = fetch_active_hazard_wards_from_db(
            hazard_type=hazard_type,
            database_id=database_id,
        )

    # 2. Fetch active/non-closed locations from Appwrite TablesDB
    tdb = get_tables_db_service()
    candidates: List[Dict[str, Any]] = []

    try:
        from appwrite.query import Query

        # Fetch up to 100 emergency locations
        response = tdb.list_rows(
            database_id=database_id,
            table_id=table_id,
            queries=[Query.limit(100)],
        )
        rows = get_items_from_response(response, "rows")
        for r in rows:
            candidates.append(normalize_row_data(r))
    except Exception as e:
        print(f"Warning: error fetching emergency locations: {e}")
        return []

    # 3. Filter by safety & compute distance
    safe_locations = []
    for loc in candidates:
        # Check type filter if requested
        if preferred_types and loc.get("type") not in preferred_types:
            continue

        # Safety-First Filter
        safe, reason = is_location_safe(
            location=loc,
            affected_zones=affected_zones,
            current_hazard=hazard_type,
        )
        if not safe:
            continue

        loc_lat = loc.get("latitude")
        loc_lon = loc.get("longitude")
        if loc_lat is None or loc_lon is None:
            continue

        distance_km = haversine_distance(user_lat, user_lon, loc_lat, loc_lon)
        if distance_km > max_radius_km:
            continue

        result_item = {
            "id": loc.get("id") or loc.get("$id"),
            "name": loc.get("name"),
            "type": loc.get("type"),
            "latitude": loc_lat,
            "longitude": loc_lon,
            "address": loc.get("address") or "",
            "ward_id": loc.get("ward_id"),
            "distance_km": distance_km,
            "status": loc.get("status", "ACTIVE"),
            "capacity": loc.get("capacity"),
            "available_capacity": loc.get("available_capacity"),
            "hazard_type": loc.get("hazard_type"),
            "created_by": loc.get("created_by"),
            "is_government_verified": bool(loc.get("is_government_verified", False)),
            "safety_status": "SAFE",
        }
        safe_locations.append(result_item)

    # 4. Rank suitable locations:
    # Primary: distance
    # Secondary: Government verified preference (small tie-breaker or priority ranking)
    # A verified facility is prioritized when within comparable distance.
    def ranking_key(item: Dict[str, Any]) -> Tuple[int, float]:
        # Government verified facilities receive priority tier 0, others tier 1,
        # sorted by distance within each tier.
        verified_tier = 0 if item["is_government_verified"] else 1
        return (verified_tier, item["distance_km"])

    safe_locations.sort(key=ranking_key)

    return safe_locations[:max_results]


# ==============================================================================
# GOVERNMENT EMERGENCY CAMP SUPPORT & LOCATION CRUD
# ==============================================================================

def create_emergency_location(
    name: str,
    type: str,
    latitude: float,
    longitude: float,
    address: Optional[str] = None,
    ward_id: Optional[str] = None,
    status: str = "ACTIVE",
    capacity: Optional[int] = None,
    available_capacity: Optional[int] = None,
    hazard_type: Optional[str] = None,
    created_by: Optional[str] = None,
    is_government_verified: bool = False,
    database_id: str = DATABASE_ID,
    table_id: str = TABLE_ID,
) -> Dict[str, Any]:
    """
    Creates a new emergency location in the Appwrite database.
    Can represent permanent emergency facilities or temporary relief centers.
    """
    from appwrite.id import ID

    if type not in VALID_LOCATION_TYPES:
        raise ValueError(f"Invalid type '{type}'. Must be one of: {sorted(VALID_LOCATION_TYPES)}")

    status = status.upper()
    if status not in VALID_STATUSES:
        raise ValueError(f"Invalid status '{status}'. Must be one of: {sorted(VALID_STATUSES)}")

    if available_capacity is None and capacity is not None:
        available_capacity = capacity

    row_data = {
        "name": str(name),
        "type": str(type),
        "latitude": float(latitude),
        "longitude": float(longitude),
        "address": str(address) if address else None,
        "ward_id": str(ward_id) if ward_id else None,
        "status": status,
        "capacity": int(capacity) if capacity is not None else None,
        "available_capacity": int(available_capacity) if available_capacity is not None else None,
        "hazard_type": str(hazard_type) if hazard_type else None,
        "created_by": str(created_by) if created_by else None,
        "is_government_verified": bool(is_government_verified),
    }

    # Clean out None keys to satisfy strict required vs optional API validation
    cleaned_data = {k: v for k, v in row_data.items() if v is not None}

    tdb = get_tables_db_service()
    doc_id = ID.unique()

    created_row = tdb.create_row(
        database_id=database_id,
        table_id=table_id,
        row_id=doc_id,
        data=cleaned_data,
    )
    return normalize_row_data(created_row)


def create_government_emergency_camp(
    name: str,
    latitude: float,
    longitude: float,
    address: Optional[str] = None,
    ward_id: Optional[str] = None,
    capacity: Optional[int] = None,
    available_capacity: Optional[int] = None,
    hazard_type: Optional[str] = None,
    created_by: str = "Authorized BMC Official",
    database_id: str = DATABASE_ID,
    table_id: str = TABLE_ID,
) -> Dict[str, Any]:
    """
    Dedicated backend function for authorized government officials to create
    and activate a temporary emergency disaster relief camp.

    Automatically sets:
    - type = "government_camp"
    - is_government_verified = True
    - status = "ACTIVE"
    """
    return create_emergency_location(
        name=name,
        type="government_camp",
        latitude=latitude,
        longitude=longitude,
        address=address,
        ward_id=ward_id,
        status="ACTIVE",
        capacity=capacity,
        available_capacity=available_capacity,
        hazard_type=hazard_type,
        created_by=created_by,
        is_government_verified=True,
        database_id=database_id,
        table_id=table_id,
    )


def update_emergency_location(
    location_id: str,
    database_id: str = DATABASE_ID,
    table_id: str = TABLE_ID,
    **updates: Any,
) -> Dict[str, Any]:
    """Updates fields on an existing emergency location."""
    tdb = get_tables_db_service()

    payload = {}
    for k, v in updates.items():
        if k == "status":
            v_upper = str(v).upper()
            if v_upper not in VALID_STATUSES:
                raise ValueError(f"Invalid status '{v}'. Must be one of: {sorted(VALID_STATUSES)}")
            payload["status"] = v_upper
        elif k == "type":
            if v not in VALID_LOCATION_TYPES:
                raise ValueError(f"Invalid type '{v}'. Must be one of: {sorted(VALID_LOCATION_TYPES)}")
            payload["type"] = v
        elif k in ("latitude", "longitude"):
            payload[k] = float(v)
        elif k in ("capacity", "available_capacity"):
            payload[k] = int(v) if v is not None else None
        elif k == "is_government_verified":
            payload[k] = bool(v)
        elif k in ("name", "address", "ward_id", "hazard_type", "created_by"):
            payload[k] = str(v) if v is not None else None

    cleaned_payload = {k: v for k, v in payload.items() if v is not None}

    updated_row = tdb.update_row(
        database_id=database_id,
        table_id=table_id,
        row_id=location_id,
        data=cleaned_payload,
    )
    return normalize_row_data(updated_row)


def update_camp_capacity(
    location_id: str,
    capacity: Optional[int] = None,
    available_capacity: Optional[int] = None,
    auto_update_status: bool = True,
    database_id: str = DATABASE_ID,
    table_id: str = TABLE_ID,
) -> Dict[str, Any]:
    """
    Updates the total and/or available capacity of an emergency camp.
    If available_capacity reaches 0 and auto_update_status is True, marks the camp FULL.
    If available_capacity > 0 and camp was FULL, restores to ACTIVE.
    """
    updates: Dict[str, Any] = {}
    if capacity is not None:
        updates["capacity"] = int(capacity)
    if available_capacity is not None:
        avail = int(available_capacity)
        updates["available_capacity"] = avail
        if auto_update_status:
            if avail <= 0:
                updates["status"] = "FULL"
            else:
                updates["status"] = "ACTIVE"

    return update_emergency_location(
        location_id=location_id,
        database_id=database_id,
        table_id=table_id,
        **updates,
    )


def update_camp_status(
    location_id: str,
    status: str,
    database_id: str = DATABASE_ID,
    table_id: str = TABLE_ID,
) -> Dict[str, Any]:
    """Updates camp status: 'ACTIVE', 'FULL', or 'CLOSED'."""
    return update_emergency_location(
        location_id=location_id,
        status=status,
        database_id=database_id,
        table_id=table_id,
    )


def activate_camp(location_id: str, database_id: str = DATABASE_ID, table_id: str = TABLE_ID) -> Dict[str, Any]:
    """Convenience function to activate an emergency camp."""
    return update_camp_status(location_id=location_id, status="ACTIVE", database_id=database_id, table_id=table_id)


def mark_camp_full(location_id: str, database_id: str = DATABASE_ID, table_id: str = TABLE_ID) -> Dict[str, Any]:
    """Convenience function to mark an emergency camp as FULL."""
    return update_emergency_location(
        location_id=location_id,
        status="FULL",
        available_capacity=0,
        database_id=database_id,
        table_id=table_id,
    )


def close_camp(location_id: str, database_id: str = DATABASE_ID, table_id: str = TABLE_ID) -> Dict[str, Any]:
    """Convenience function to close an emergency camp."""
    return update_camp_status(location_id=location_id, status="CLOSED", database_id=database_id, table_id=table_id)


def verify_emergency_location(
    location_id: str,
    is_verified: bool = True,
    database_id: str = DATABASE_ID,
    table_id: str = TABLE_ID,
) -> Dict[str, Any]:
    """Authorized function to toggle government verification on an emergency location."""
    return update_emergency_location(
        location_id=location_id,
        is_government_verified=is_verified,
        database_id=database_id,
        table_id=table_id,
    )


def get_emergency_location(
    location_id: str,
    database_id: str = DATABASE_ID,
    table_id: str = TABLE_ID,
) -> Dict[str, Any]:
    """Fetches a single emergency location by its document ID."""
    tdb = get_tables_db_service()
    row = tdb.get_row(database_id=database_id, table_id=table_id, row_id=location_id)
    return normalize_row_data(row)


def list_emergency_locations(
    status: Optional[str] = None,
    type: Optional[str] = None,
    ward_id: Optional[str] = None,
    is_government_verified: Optional[bool] = None,
    hazard_type: Optional[str] = None,
    limit: int = 100,
    database_id: str = DATABASE_ID,
    table_id: str = TABLE_ID,
) -> List[Dict[str, Any]]:
    """Lists emergency locations with optional filters."""
    from appwrite.query import Query

    tdb = get_tables_db_service()
    queries = [Query.limit(limit)]

    if status:
        queries.append(Query.equal("status", status.upper()))
    if type:
        queries.append(Query.equal("type", type))
    if ward_id:
        queries.append(Query.equal("ward_id", ward_id))
    if is_government_verified is not None:
        queries.append(Query.equal("is_government_verified", bool(is_government_verified)))
    if hazard_type:
        queries.append(Query.equal("hazard_type", hazard_type))

    try:
        response = tdb.list_rows(database_id=database_id, table_id=table_id, queries=queries)
        rows = get_items_from_response(response, "rows")
        return [normalize_row_data(r) for r in rows]
    except Exception as e:
        print(f"Warning: error listing emergency locations: {e}")
        return []


def delete_emergency_location(
    location_id: str,
    database_id: str = DATABASE_ID,
    table_id: str = TABLE_ID,
) -> bool:
    """Deletes an emergency location row (primarily used for test cleanup)."""
    tdb = get_tables_db_service()
    try:
        tdb.delete_row(database_id=database_id, table_id=table_id, row_id=location_id)
        return True
    except Exception as e:
        print(f"Warning: error deleting row {location_id}: {e}")
        return False


# ==============================================================================
# INTEGRATION WITH EXISTING RISK ENGINE
# ==============================================================================

def get_safe_places_for_ward_alert(
    ward_id: str,
    hazard_type: Optional[str] = None,
    all_ward_results: Optional[List[Dict[str, Any]]] = None,
    max_results: int = 5,
) -> List[Dict[str, Any]]:
    """
    Connects with the existing risk engine alerts (where show_safe_place = True).
    Extracts ward coordinates from WARD_DATA, identifies affected wards,
    and returns safe emergency locations outside the hazard zone.
    """
    import risk_engine

    ward_info = risk_engine.WARD_DATA.get(ward_id)
    if not ward_info:
        raise ValueError(f"Unknown BMC ward ID: {ward_id}")

    ward_lat = ward_info["lat"] or risk_engine.BHUBANESWAR_LAT
    ward_lon = ward_info["lon"] or risk_engine.BHUBANESWAR_LON

    # Build affected zones from all_ward_results if provided
    affected_zones = set()
    if all_ward_results:
        for w in all_ward_results:
            w_id = w.get("ward_id")
            if not w_id:
                continue
            if hazard_type and hazard_type in w.get("hazards", {}):
                h_sev = w["hazards"][hazard_type].get("severity")
                if h_sev in ("HIGH", "EMERGENCY"):
                    affected_zones.add(w_id)
            elif w.get("overall_severity") in ("HIGH", "EMERGENCY"):
                affected_zones.add(w_id)
    else:
        # Default to DB query
        affected_zones = fetch_active_hazard_wards_from_db(hazard_type=hazard_type)

    # Always ensure the origin affected ward is marked unsafe
    affected_zones.add(ward_id)

    return find_safe_emergency_locations(
        user_lat=ward_lat,
        user_lon=ward_lon,
        hazard_type=hazard_type,
        affected_zones=affected_zones,
        max_results=max_results,
    )
