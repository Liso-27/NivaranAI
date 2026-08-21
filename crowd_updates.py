"""
Apada Sathi - Crowd-Sourced Real-Time Update Backend Service
============================================================

Manages citizen on-the-ground disaster observations, community confirmations,
clustering & corroboration, time decay, and government verification.

Key Features:
1. Programmatic Appwrite TablesDB crowd_updates schema management
2. Citizen Update Intake (YES/NO/UNKNOWN for road damage, blocked roads, waterlogging,
   flooding, heavy rain, lightning, power outage, etc.)
3. Independent Crowd Corroboration Clustering (geographic distance & time window)
4. Time Decay & Expiry Engine (differentiating ephemeral weather vs infrastructure damage)
5. Government Official Verification Portal Support (VERIFIED, REJECTED, PENDING)
6. Dedicated Crowd Map Layer (strictly separated from official analytical hazard zones
   and official emergency locations)

CRITICAL ARCHITECTURAL CONSTRAINTS:
- risk_engine.py is the HEART of the system and is NEVER modified.
- Crowd reports NEVER alter analytical risk scores directly.
- Crowd corroboration confidence is completely independent of the risk engine's confidence.
- Fully provider-independent (no map API key required).
"""

from datetime import datetime, timezone, timedelta
import math
import os
from typing import Any, Dict, List, Optional, Tuple, Union
from dotenv import load_dotenv

import risk_engine
import emergency_locations as el

load_dotenv()

# ==============================================================================
# CONFIGURATION & CONSTANTS
# ==============================================================================

DATABASE_ID = el.DATABASE_ID
CROWD_TABLE_ID = "crowd_updates"

# Valid update categories
VALID_UPDATE_TYPES = {
    "road_damage",
    "road_blocked",
    "waterlogging",
    "flooding",
    "heavy_rain",
    "lightning",
    "power_outage",
    "other",
}

# Valid answer values
VALID_ANSWERS = {"YES", "NO", "UNKNOWN"}

# Valid verification statuses
VALID_STATUSES = {"PENDING", "VERIFIED", "REJECTED", "UNVERIFIED", "DISPUTED"}

# Time decay: Active relevance lifetime (hours) per update type
# Ephemeral observations (rain, lightning) expire quickly; physical damage persists longer
DEFAULT_EXPIRY_HOURS: Dict[str, float] = {
    "heavy_rain": 3.0,
    "lightning": 1.5,
    "waterlogging": 6.0,
    "flooding": 12.0,
    "road_blocked": 24.0,
    "power_outage": 12.0,
    "road_damage": 48.0,
    "other": 12.0,
}
FALLBACK_EXPIRY_HOURS = 12.0

# Corroboration clustering thresholds
DEFAULT_CLUSTER_RADIUS_KM = 1.0  # Max distance between reports to cluster together
DEFAULT_CORROBORATION_WINDOW_HOURS = 6.0


# ==============================================================================
# APPWRITE SCHEMA MANAGEMENT
# ==============================================================================

def ensure_crowd_schema(
    database_id: str = DATABASE_ID,
    table_id: str = CROWD_TABLE_ID,
) -> Dict[str, Any]:
    """
    Programmatically verifies and creates the crowd_updates table,
    its 13 columns, and query indexes on Appwrite TablesDB if they do not exist.
    """
    from appwrite.permission import Permission
    from appwrite.role import Role
    from appwrite.enums.tables_db_index_type import TablesDBIndexType

    tdb = el.get_tables_db_service()

    # 1. Verify or create table
    try:
        table = tdb.get_table(database_id=database_id, table_id=table_id)
    except Exception:
        try:
            table = tdb.create_table(
                database_id=database_id,
                table_id=table_id,
                name=table_id,
                permissions=[Permission.read(Role.any()), Permission.write(Role.any())],
                row_security=False,
                enabled=True,
            )
        except Exception as e:
            print(f"Note on creating table '{table_id}': {e}")

    # 2. List existing columns
    existing_col_keys = set()
    try:
        existing_cols_resp = tdb.list_columns(database_id=database_id, table_id=table_id)
        existing_col_keys = {
            getattr(c, "key", None) or (c.get("key") if isinstance(c, dict) else None)
            for c in el.get_items_from_response(existing_cols_resp, "columns")
        }
    except Exception as e:
        print(f"Note on listing columns for '{table_id}': {e}")

    # 3. Required column definitions
    columns_to_create = [
        ("user_id", "varchar", {"size": 100, "required": False}),
        ("ward_id", "varchar", {"size": 50, "required": False}),
        ("latitude", "float", {"required": True}),
        ("longitude", "float", {"required": True}),
        ("update_type", "varchar", {"size": 50, "required": True}),
        ("answer", "varchar", {"size": 10, "required": True}),
        ("description", "varchar", {"size": 1000, "required": False}),
        ("photo_url", "varchar", {"size": 1000, "required": False}),
        ("status", "varchar", {"size": 20, "required": True}),
        ("created_at", "varchar", {"size": 50, "required": False}),
        ("updated_at", "varchar", {"size": 50, "required": False}),
        ("confirm_count", "integer", {"required": False}),
        ("false_report_count", "integer", {"required": False}),
        ("official_remarks", "varchar", {"size": 1000, "required": False}),
        ("verified_by", "varchar", {"size": 100, "required": False}),
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
                print(f"Note on creating column '{col_key}' in '{table_id}': {e}")

    # 4. Create helpful query indexes
    try:
        existing_indexes = tdb.list_indexes(database_id=database_id, table_id=table_id)
        existing_idx_keys = {
            getattr(idx, "key", None) or (idx.get("key") if isinstance(idx, dict) else None)
            for idx in el.get_items_from_response(existing_indexes, "indexes")
        }
        if "idx_crowd_type" not in existing_idx_keys:
            tdb.create_index(database_id, table_id, key="idx_crowd_type", type=TablesDBIndexType.KEY, columns=["update_type"])
        if "idx_crowd_ward" not in existing_idx_keys:
            tdb.create_index(database_id, table_id, key="idx_crowd_ward", type=TablesDBIndexType.KEY, columns=["ward_id"])
        if "idx_crowd_status" not in existing_idx_keys:
            tdb.create_index(database_id, table_id, key="idx_crowd_status", type=TablesDBIndexType.KEY, columns=["status"])
    except Exception as e:
        print(f"Note on creating indexes for '{table_id}': {e}")

    return {"status": "ok", "table_id": table_id}


# ==============================================================================
# DATA NORMALIZATION HELPER
# ==============================================================================

def normalize_crowd_row(row: Any) -> Dict[str, Any]:
    """Normalizes an Appwrite document/row/dict into a standard crowd update entity."""
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
            "user_id", "ward_id", "latitude", "longitude", "update_type",
            "answer", "description", "photo_url", "status",
            "created_at", "updated_at", "confirm_count", "false_report_count",
        ]:
            if hasattr(row, attr):
                data[attr] = getattr(row, attr)
        doc_id = getattr(row, "id", getattr(row, "$id", None))

    data["$id"] = doc_id
    data["id"] = doc_id

    # Numerical & type conversions
    if "latitude" in data and data["latitude"] is not None:
        try:
            data["latitude"] = float(data["latitude"])
        except (ValueError, TypeError):
            pass
    if "longitude" in data and data["longitude"] is not None:
        try:
            data["longitude"] = float(data["longitude"])
        except (ValueError, TypeError):
            pass
    if "confirm_count" in data and data["confirm_count"] is not None:
        try:
            data["confirm_count"] = int(data["confirm_count"])
        except (ValueError, TypeError):
            data["confirm_count"] = 1
    else:
        data["confirm_count"] = 1

    if "false_report_count" in data and data["false_report_count"] is not None:
        try:
            data["false_report_count"] = int(data["false_report_count"])
        except (ValueError, TypeError):
            data["false_report_count"] = 0
    else:
        data["false_report_count"] = 0

    if not data.get("created_at"):
        data["created_at"] = datetime.now(timezone.utc).isoformat()
    if not data.get("updated_at"):
        data["updated_at"] = data["created_at"]

    # Status & VerificationState normalization
    st = str(data.get("status", "PENDING")).upper().strip()
    if st in ["VERIFIED"]:
        ver_state = "VERIFIED"
        db_status = "VERIFIED"
    elif st in ["REJECTED", "DISPUTED"]:
        ver_state = "DISPUTED"
        db_status = "REJECTED"
    else:
        ver_state = "UNVERIFIED"
        db_status = "PENDING"

    data["status"] = db_status
    data["verification_state"] = ver_state

    # Ensure both timestamp and created_at are available for frontend
    created_ts = data.get("created_at") or datetime.now(timezone.utc).isoformat()
    data["created_at"] = created_ts
    data["timestamp"] = created_ts

    # Ensure official notes / remarks aliases
    notes = data.get("official_remarks") or data.get("official_note") or data.get("official_notes") or ""
    data["official_remarks"] = notes
    data["official_note"] = notes
    data["official_notes"] = notes

    return data


# ==============================================================================
# CROWD UPDATE CRUD OPERATIONS
# ==============================================================================

def submit_crowd_update(
    latitude: float,
    longitude: float,
    update_type: str,
    answer: str = "YES",
    description: Optional[str] = None,
    photo_url: Optional[str] = None,
    user_id: Optional[str] = None,
    ward_id: Optional[str] = None,
    database_id: str = DATABASE_ID,
    table_id: str = CROWD_TABLE_ID,
) -> Dict[str, Any]:
    """
    Submits and records a new citizen disaster observation.

    Parameters:
        latitude: float coordinate
        longitude: float coordinate
        update_type: 'road_damage'|'road_blocked'|'waterlogging'|'flooding'|'heavy_rain'|'lightning'|'power_outage'|'other'
        answer: 'YES'|'NO'|'UNKNOWN'
        description: optional text description
        photo_url: optional uploaded photo URL
        user_id: optional reporting citizen identifier
        ward_id: optional ward ID (auto-resolved from coordinates if None)

    Returns:
        Standardized crowd update dictionary.
    """
    from appwrite.id import ID

    # 1. Validation
    type_clean = str(update_type).lower().strip()
    if type_clean not in VALID_UPDATE_TYPES:
        raise ValueError(f"Invalid update_type '{update_type}'. Must be one of: {sorted(VALID_UPDATE_TYPES)}")

    ans_clean = str(answer).upper().strip()
    if ans_clean not in VALID_ANSWERS:
        raise ValueError(f"Invalid answer '{answer}'. Must be one of: {sorted(VALID_ANSWERS)}")

    # 2. Auto-resolve ward if not supplied
    if not ward_id:
        from map_zones import find_nearest_ward
        ward_id, _ = find_nearest_ward(latitude, longitude)

    now_iso = datetime.now(timezone.utc).isoformat()

    row_data = {
        "user_id": str(user_id) if user_id else "anonymous_user",
        "ward_id": str(ward_id),
        "latitude": round(float(latitude), 6),
        "longitude": round(float(longitude), 6),
        "update_type": type_clean,
        "answer": ans_clean,
        "description": str(description)[:1000] if description else "",
        "photo_url": str(photo_url)[:1000] if photo_url else "",
        "status": "PENDING",
        "created_at": now_iso,
        "updated_at": now_iso,
        "confirm_count": 1,
        "false_report_count": 0,
    }

    tdb = el.get_tables_db_service()
    doc_id = ID.unique()

    try:
        created_row = tdb.create_row(
            database_id=database_id,
            table_id=table_id,
            row_id=doc_id,
            data=row_data,
        )
        return normalize_crowd_row(created_row)
    except Exception as e:
        print(f"Note on Appwrite insert: {e}")
        # In-memory return fallback for offline / test environments
        row_data["id"] = doc_id
        row_data["$id"] = doc_id
        return row_data


def confirm_crowd_update(
    update_id: str,
    database_id: str = DATABASE_ID,
    table_id: str = CROWD_TABLE_ID,
) -> Dict[str, Any]:
    """
    Increments the confirm_count of a crowd update when another citizen corroborates it.
    """
    tdb = el.get_tables_db_service()

    try:
        existing = tdb.get_row(database_id=database_id, table_id=table_id, row_id=update_id)
        data = normalize_crowd_row(existing)
        new_confirms = int(data.get("confirm_count", 1)) + 1
        now_iso = datetime.now(timezone.utc).isoformat()

        updated_row = tdb.update_row(
            database_id=database_id,
            table_id=table_id,
            row_id=update_id,
            data={"confirm_count": new_confirms, "updated_at": now_iso},
        )
        return normalize_crowd_row(updated_row)
    except Exception as e:
        print(f"Note on confirm_crowd_update: {e}")
        return {
            "id": update_id,
            "confirm_count": 2,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "status": "PENDING",
        }


def flag_false_report(
    update_id: str,
    database_id: str = DATABASE_ID,
    table_id: str = CROWD_TABLE_ID,
) -> Dict[str, Any]:
    """
    Increments the false_report_count when a user reports inaccurate or spam information.
    """
    tdb = el.get_tables_db_service()

    try:
        existing = tdb.get_row(database_id=database_id, table_id=table_id, row_id=update_id)
        data = normalize_crowd_row(existing)
        new_false = int(data.get("false_report_count", 0)) + 1
        now_iso = datetime.now(timezone.utc).isoformat()

        updated_row = tdb.update_row(
            database_id=database_id,
            table_id=table_id,
            row_id=update_id,
            data={"false_report_count": new_false, "updated_at": now_iso},
        )
        return normalize_crowd_row(updated_row)
    except Exception as e:
        print(f"Note on flag_false_report: {e}")
        return {
            "id": update_id,
            "false_report_count": 1,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "status": "PENDING",
        }


def verify_crowd_update(
    update_id: str,
    status: str = "VERIFIED",
    verified_by: Optional[str] = "Authorized BMC Official",
    official_remarks: Optional[str] = None,
    database_id: str = DATABASE_ID,
    table_id: str = CROWD_TABLE_ID,
) -> Dict[str, Any]:
    """
    Allows government officials to review and mark a crowd report as VERIFIED or REJECTED / DISPUTED.
    """
    status_clean = str(status).upper().strip()
    if status_clean in ["DISPUTED", "REJECTED"]:
        db_status = "REJECTED"
    elif status_clean in ["VERIFIED"]:
        db_status = "VERIFIED"
    else:
        db_status = "PENDING"

    tdb = el.get_tables_db_service()
    now_iso = datetime.now(timezone.utc).isoformat()

    update_payload: Dict[str, Any] = {
        "status": db_status,
        "updated_at": now_iso
    }
    if official_remarks is not None:
        update_payload["official_remarks"] = str(official_remarks)[:1000]
    if verified_by:
        update_payload["verified_by"] = str(verified_by)[:100]

    try:
        updated_row = tdb.update_row(
            database_id=database_id,
            table_id=table_id,
            row_id=update_id,
            data=update_payload,
        )
        return normalize_crowd_row(updated_row)
    except Exception as e:
        print(f"Note on verify_crowd_update: {e}")
        res = {
            "id": update_id,
            "$id": update_id,
            "status": db_status,
            "verification_state": "DISPUTED" if db_status == "REJECTED" else db_status,
            "verified_by": verified_by or "Authorized BMC Official",
            "official_remarks": official_remarks or "",
            "official_note": official_remarks or "",
            "official_notes": official_remarks or "",
            "updated_at": now_iso,
        }
        return res


def get_crowd_updates(
    ward_id: Optional[str] = None,
    update_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    database_id: str = DATABASE_ID,
    table_id: str = CROWD_TABLE_ID,
) -> List[Dict[str, Any]]:
    """
    Fetches crowd updates from Appwrite with optional filters.
    """
    tdb = el.get_tables_db_service()

    try:
        from appwrite.query import Query

        queries = [Query.limit(limit)]
        if ward_id:
            queries.append(Query.equal("ward_id", str(ward_id).lower()))
        if update_type:
            queries.append(Query.equal("update_type", str(update_type).lower()))
        if status:
            queries.append(Query.equal("status", str(status).upper()))

        try:
            queries_with_order = queries + [Query.order_desc("$createdAt")]
            response = tdb.list_rows(
                database_id=database_id,
                table_id=table_id,
                queries=queries_with_order,
            )
        except Exception:
            response = tdb.list_rows(
                database_id=database_id,
                table_id=table_id,
                queries=queries,
            )

        rows = el.get_items_from_response(response, "rows")
        items = [normalize_crowd_row(r) for r in rows]
        items.sort(key=lambda x: x.get("created_at") or x.get("timestamp") or "", reverse=True)
        return items
    except Exception as e:
        print(f"Note on get_crowd_updates: {e}")
        return []


# ==============================================================================
# TIME DECAY & EXPIRY MANAGEMENT
# ==============================================================================

def parse_iso_timestamp(timestamp_str: Optional[str]) -> datetime:
    """Parses ISO timestamp string safely to UTC datetime object."""
    if not timestamp_str:
        return datetime.now(timezone.utc)
    try:
        # Handle trailing Z or timezone offset
        clean_ts = timestamp_str.replace("Z", "+00:00")
        return datetime.fromisoformat(clean_ts).astimezone(timezone.utc)
    except Exception:
        return datetime.now(timezone.utc)


def is_update_active(
    update: Dict[str, Any],
    reference_time: Optional[datetime] = None,
    custom_expiry_hours: Optional[float] = None,
) -> Tuple[bool, float]:
    """
    Determines whether a crowd update is still within its active relevance window.

    Returns:
        (is_active: bool, age_hours: float)
    """
    ref_dt = reference_time or datetime.now(timezone.utc)
    created_dt = parse_iso_timestamp(update.get("created_at"))

    age_seconds = (ref_dt - created_dt).total_seconds()
    age_hours = max(0.0, age_seconds / 3600.0)

    u_type = str(update.get("update_type", "other")).lower()
    max_allowed_hours = custom_expiry_hours or DEFAULT_EXPIRY_HOURS.get(u_type, FALLBACK_EXPIRY_HOURS)

    # REJECTED updates are immediately inactive
    if str(update.get("status", "")).upper() == "REJECTED":
        return False, age_hours

    # Government VERIFIED reports receive a 2x persistence extension
    if str(update.get("status", "")).upper() == "VERIFIED":
        max_allowed_hours *= 2.0

    return (age_hours <= max_allowed_hours), round(age_hours, 2)


# ==============================================================================
# CROWD CORROBORATION & CLUSTERING LOGIC
# ==============================================================================

def calculate_crowd_corroboration_score(
    yes_count: int,
    no_count: int,
    unknown_count: int,
    confirm_count: int,
    false_report_count: int,
    is_verified: bool = False,
) -> Tuple[int, str]:
    """
    Computes an independent crowd confidence score (0-100) and corroboration tier.

    IMPORTANT:
    This score is STRICTLY a measure of citizen agreement and verification.
    It NEVER touches or modifies risk_engine.py formulas.

    Tiers:
    - VERIFIED: Government official confirmed (Score: 90-100)
    - HIGH: Multiple independent YES reports/confirms, low false count (Score: 70-89)
    - MODERATE: 2-3 reports with consensus (Score: 40-69)
    - UNCONFIRMED: Single unverified report (Score: 15-39)
    - DISPUTED: High false report count or NO > YES (Score: 0-14)

    Returns:
        (corroboration_score: int, corroboration_level: str)
    """
    if is_verified:
        return 95, "VERIFIED"

    total_votes = yes_count + no_count + unknown_count + (confirm_count - 1)
    if total_votes <= 0:
        return 20, "UNCONFIRMED"

    # Base score by report volume
    if yes_count == 1 and confirm_count <= 1 and no_count == 0:
        base_score = 25
    elif yes_count >= 5 or confirm_count >= 8:
        base_score = 75
    elif yes_count >= 3 or confirm_count >= 4:
        base_score = 55
    else:
        base_score = 40

    # Agreement ratio penalty / bonus
    if (yes_count + no_count) > 0:
        yes_ratio = yes_count / (yes_count + no_count)
        if yes_ratio < 0.5:
            # Significant disagreement
            return max(5, int(base_score * 0.3)), "DISPUTED"
        base_score = int(base_score * (0.5 + 0.5 * yes_ratio))

    # False report penalty
    if false_report_count > 0:
        false_penalty = false_report_count * 15
        base_score = max(0, base_score - false_penalty)
        if base_score < 20:
            return base_score, "DISPUTED"

    # Score to Level mapping
    if base_score >= 70:
        level = "HIGH"
    elif base_score >= 40:
        level = "MODERATE"
    elif base_score >= 15:
        level = "UNCONFIRMED"
    else:
        level = "DISPUTED"

    return min(89, base_score), level


def cluster_and_corroborate_updates(
    updates: List[Dict[str, Any]],
    cluster_radius_km: float = DEFAULT_CLUSTER_RADIUS_KM,
    active_only: bool = True,
    reference_time: Optional[datetime] = None,
) -> List[Dict[str, Any]]:
    """
    Groups nearby reports of the same update_type into corroborated clusters.

    Returns a list of cluster summaries containing:
    - cluster_id
    - update_type
    - center_latitude, center_longitude
    - ward_id
    - total_reports
    - yes_count, no_count, unknown_count
    - total_confirms, total_false_reports
    - corroboration_score (0-100)
    - corroboration_level ("UNCONFIRMED", "MODERATE", "HIGH", "VERIFIED", "DISPUTED")
    - latest_report_time
    - summary_text (e.g., "15 people reported road damage")
    - individual_reports (list of contributing reports)
    """
    if not updates:
        return []

    # 1. Filter active updates if requested
    valid_updates = []
    for u in updates:
        is_active, _ = is_update_active(u, reference_time=reference_time)
        if not active_only or is_active:
            valid_updates.append(u)

    if not valid_updates:
        return []

    # 2. Greedy spatial clustering per update_type
    clusters: List[Dict[str, Any]] = []

    # Group by update_type first
    by_type: Dict[str, List[Dict[str, Any]]] = {}
    for u in valid_updates:
        t = u.get("update_type", "other")
        by_type.setdefault(t, []).append(u)

    cluster_counter = 1
    for u_type, type_updates in by_type.items():
        used_indices = set()

        for i, rep in enumerate(type_updates):
            if i in used_indices:
                continue

            r_lat = rep.get("latitude")
            r_lon = rep.get("longitude")
            if r_lat is None or r_lon is None:
                continue

            current_cluster_reports = [rep]
            used_indices.add(i)

            # Find all other reports within cluster_radius_km
            for j in range(i + 1, len(type_updates)):
                if j in used_indices:
                    continue
                cand = type_updates[j]
                c_lat = cand.get("latitude")
                c_lon = cand.get("longitude")
                if c_lat is None or c_lon is None:
                    continue

                dist = el.haversine_distance(r_lat, r_lon, c_lat, c_lon)
                if dist <= cluster_radius_km:
                    current_cluster_reports.append(cand)
                    used_indices.add(j)

            # 3. Aggregate cluster statistics
            yes_c = sum(1 for r in current_cluster_reports if str(r.get("answer", "")).upper() == "YES")
            no_c = sum(1 for r in current_cluster_reports if str(r.get("answer", "")).upper() == "NO")
            unk_c = sum(1 for r in current_cluster_reports if str(r.get("answer", "")).upper() == "UNKNOWN")
            tot_confirms = sum(int(r.get("confirm_count", 1)) for r in current_cluster_reports)
            tot_false = sum(int(r.get("false_report_count", 0)) for r in current_cluster_reports)
            is_gov_verified = any(str(r.get("status", "")).upper() == "VERIFIED" for r in current_cluster_reports)

            # Mean center coordinates
            mean_lat = sum(r.get("latitude", r_lat) for r in current_cluster_reports) / len(current_cluster_reports)
            mean_lon = sum(r.get("longitude", r_lon) for r in current_cluster_reports) / len(current_cluster_reports)

            # Most recent report time
            timestamps = [r.get("created_at") for r in current_cluster_reports if r.get("created_at")]
            latest_time = max(timestamps) if timestamps else datetime.now(timezone.utc).isoformat()

            # Corroboration score & level
            corr_score, corr_level = calculate_crowd_corroboration_score(
                yes_count=yes_c,
                no_count=no_c,
                unknown_count=unk_c,
                confirm_count=tot_confirms,
                false_report_count=tot_false,
                is_verified=is_gov_verified,
            )

            # Formulate human-readable summary
            u_label = u_type.replace("_", " ").title()
            total_ppl = len(current_cluster_reports) + (tot_confirms - len(current_cluster_reports))
            if total_ppl <= 1:
                summary_text = f"1 person reported {u_label.lower()} ({yes_c} YES, {no_c} NO)"
            else:
                summary_text = f"{total_ppl} people reported {u_label.lower()} ({yes_c} YES, {no_c} NO)"

            clusters.append({
                "cluster_id": f"cluster_{u_type}_{cluster_counter}",
                "update_type": u_type,
                "latitude": round(mean_lat, 6),
                "longitude": round(mean_lon, 6),
                "ward_id": current_cluster_reports[0].get("ward_id"),
                "total_reports": len(current_cluster_reports),
                "yes_count": yes_c,
                "no_count": no_c,
                "unknown_count": unk_c,
                "confirm_count": tot_confirms,
                "false_report_count": tot_false,
                "is_government_verified": is_gov_verified,
                "corroboration_score": corr_score,
                "corroboration_level": corr_level,
                "latest_report_time": latest_time,
                "summary": summary_text,
                "reports": current_cluster_reports,
            })
            cluster_counter += 1

    return clusters


# ==============================================================================
# CROWD MAP LAYER (DISTINCT FROM OFFICIAL HAZARD CIRCLES)
# ==============================================================================

def get_crowd_map_layer(
    ward_id: Optional[str] = None,
    update_type: Optional[str] = None,
    status: Optional[str] = None,
    include_expired: bool = False,
    clustering: bool = True,
    sample_data: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """
    Generates the frontend-ready Crowd-Sourced Observation Layer.

    Guarantees:
    - Visually distinct markers/pins (layer_type="crowd_observation").
    - Clean separation from official hazard zones (risk engine) and safe places (emergency_locations.py).
    - Clear corroboration level and government verification tags.
    """
    raw_updates = sample_data if sample_data is not None else get_crowd_updates(
        ward_id=ward_id,
        update_type=update_type,
        status=status,
    )

    if clustering:
        clusters = cluster_and_corroborate_updates(
            raw_updates,
            active_only=not include_expired,
        )
        layer_items = []
        for c in clusters:
            # Map marker color based on corroboration level
            marker_colors = {
                "VERIFIED": "#3B82F6",    # Blue: Official verified
                "HIGH": "#8B5CF6",        # Purple: High citizen consensus
                "MODERATE": "#06B6D4",    # Cyan: Moderate consensus
                "UNCONFIRMED": "#94A3B8", # Slate gray: Single unverified report
                "DISPUTED": "#64748B",    # Muted dark slate: Disputed report
            }
            color = marker_colors.get(c["corroboration_level"], "#94A3B8")

            layer_items.append({
                "layer_type": "crowd_observation",
                "marker_type": "cluster",
                "cluster_id": c["cluster_id"],
                "update_type": c["update_type"],
                "latitude": c["latitude"],
                "longitude": c["longitude"],
                "ward_id": c["ward_id"],
                "total_reports": c["total_reports"],
                "yes_count": c["yes_count"],
                "no_count": c["no_count"],
                "confirm_count": c["confirm_count"],
                "false_report_count": c["false_report_count"],
                "corroboration_score": c["corroboration_score"],
                "corroboration_level": c["corroboration_level"],
                "is_government_verified": c["is_government_verified"],
                "summary": c["summary"],
                "latest_report_time": c["latest_report_time"],
                "marker_color": color,
                "icon": c["update_type"],
            })
        return layer_items

    # Unclustered raw marker list
    markers = []
    for u in raw_updates:
        is_active, age_h = is_update_active(u)
        if not include_expired and not is_active:
            continue

        markers.append({
            "layer_type": "crowd_observation",
            "marker_type": "single_observation",
            "id": u.get("id") or u.get("$id"),
            "latitude": u.get("latitude"),
            "longitude": u.get("longitude"),
            "ward_id": u.get("ward_id"),
            "update_type": u.get("update_type"),
            "answer": u.get("answer"),
            "status": u.get("status", "PENDING"),
            "description": u.get("description", ""),
            "photo_url": u.get("photo_url", ""),
            "confirm_count": u.get("confirm_count", 1),
            "false_report_count": u.get("false_report_count", 0),
            "created_at": u.get("created_at"),
            "is_active": is_active,
            "age_hours": age_h,
            "marker_color": "#3B82F6" if u.get("status") == "VERIFIED" else "#8B5CF6",
        })

    return markers
