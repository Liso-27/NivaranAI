"""
Apada Sathi - Automated Risk Execution / Appwrite Scheduled Function
====================================================================

Orchestrates periodic 20-minute automated background execution:
1. Calls existing analytical engine (risk_engine.score_all_wards()) without altering formulas
2. Detects meaningful risk state changes (preventing redundant Appwrite writes)
3. Synchronizes changed risk zones to Appwrite TablesDB
4. Evaluates registered users against active hazard zones via notification_service.py
5. Tracks lightweight execution health status (last_run_at, duration_ms, status, next_run)
6. Concurrency lock protection against overlapping job executions
7. Failure isolation (weather or network errors do not corrupt existing data or crash scheduler)
8. Compatible with Appwrite Functions Open Runtimes standard (main(context)) and manual CLI execution

CRITICAL ARCHITECTURAL CONSTRAINTS:
- risk_engine.py is the HEART of the system and is NEVER modified.
- Does NOT rewrite or copy risk engine formulas.
- Does NOT execute infinite sleep loops; completes single-shot per scheduled invocation.
- Schedule: Exactly every 20 minutes (*/20 * * * *).
"""

from datetime import datetime, timezone, timedelta
import os
import time
from typing import Any, Dict, List, Optional, Tuple
from dotenv import load_dotenv

import risk_engine
import map_zones
import notification_service

load_dotenv()

# ==============================================================================
# CONFIGURATION & CONSTANTS
# ==============================================================================

SCHEDULER_ENABLED = os.environ.get("SCHEDULER_ENABLED", "true").lower() == "true"
SCHEDULER_INTERVAL_MINUTES = int(os.environ.get("SCHEDULER_INTERVAL_MINUTES", "20"))
SCHEDULER_CRON = os.environ.get("SCHEDULER_CRON", "*/20 * * * *")
LOCK_TIMEOUT_SECONDS = 300  # 5-minute concurrency lease timeout

# In-memory execution state cache
_LAST_KNOWN_ANALYTICAL_STATE: Dict[str, Dict[str, Any]] = {}
_EXECUTION_LOCK: Dict[str, Any] = {
    "is_locked": False,
    "locked_at": 0.0,
    "locked_by": None,
}

# Lightweight execution health record
_EXECUTION_HEALTH: Dict[str, Any] = {
    "last_run_at": None,
    "status": "INITIALIZED",
    "duration_ms": 0,
    "risk_update_status": "NONE",
    "weather_status": "NONE",
    "notification_status": "NONE",
    "zones_evaluated": 0,
    "zones_changed": 0,
    "notifications_evaluated": 0,
    "notifications_triggered": 0,
    "error_summary": None,
    "next_expected_run": None,
}


# ==============================================================================
# CONCURRENCY LOCK MANAGEMENT
# ==============================================================================

def acquire_execution_lock(caller_id: str = "scheduled_runner", ttl_seconds: int = LOCK_TIMEOUT_SECONDS) -> bool:
    """
    Acquires a lightweight concurrency lock to prevent overlapping executions.
    If a previous run crashed without releasing the lock, the TTL expires automatically.

    Returns:
        bool: True if lock was acquired, False if another execution is currently active.
    """
    global _EXECUTION_LOCK
    now = time.time()

    if _EXECUTION_LOCK["is_locked"]:
        # Check if lock has expired
        if (now - _EXECUTION_LOCK["locked_at"]) > ttl_seconds:
            print("Note: Previous execution lock expired. Re-acquiring lock.")
            _EXECUTION_LOCK["is_locked"] = True
            _EXECUTION_LOCK["locked_at"] = now
            _EXECUTION_LOCK["locked_by"] = caller_id
            return True
        return False

    _EXECUTION_LOCK["is_locked"] = True
    _EXECUTION_LOCK["locked_at"] = now
    _EXECUTION_LOCK["locked_by"] = caller_id
    return True


def release_execution_lock() -> None:
    """Releases the execution lock."""
    global _EXECUTION_LOCK
    _EXECUTION_LOCK["is_locked"] = False
    _EXECUTION_LOCK["locked_at"] = 0.0
    _EXECUTION_LOCK["locked_by"] = None


# ==============================================================================
# CHANGE DETECTION & DATABASE OPTIMIZATION
# ==============================================================================

def detect_meaningful_changes(
    new_ward_results: List[Dict[str, Any]],
    score_threshold_delta: float = 1.0,
) -> Tuple[bool, List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Compares newly computed analytical results with previously stored state.

    A ward is marked as changed if:
    1. First time being evaluated (no previous state)
    2. Overall severity changed (e.g. MODERATE -> HIGH)
    3. Dominant worst hazard changed
    4. Any individual hazard score shifted by >= score_threshold_delta

    Returns:
        (has_any_changed: bool, changed_wards: list, unchanged_wards: list)
    """
    global _LAST_KNOWN_ANALYTICAL_STATE
    changed_wards = []
    unchanged_wards = []

    for ward in new_ward_results:
        ward_id = ward.get("ward_id")
        if not ward_id:
            continue

        prev = _LAST_KNOWN_ANALYTICAL_STATE.get(ward_id)
        if prev is None:
            # First execution
            changed_wards.append(ward)
            continue

        # Check severity change
        sev_changed = prev.get("overall_severity") != ward.get("overall_severity")
        # Check worst hazard change
        worst_changed = prev.get("worst_hazard") != ward.get("worst_hazard")

        # Check individual hazard score shifts
        score_shift = False
        prev_hazards = prev.get("hazards", {})
        curr_hazards = ward.get("hazards", {})

        for h_name, h_info in curr_hazards.items():
            prev_info = prev_hazards.get(h_name, {})
            curr_score = h_info.get("score", 0.0)
            prev_score = prev_info.get("score", 0.0)
            if abs(curr_score - prev_score) >= score_threshold_delta:
                score_shift = True
                break

        if sev_changed or worst_changed or score_shift:
            changed_wards.append(ward)
        else:
            unchanged_wards.append(ward)

    has_changed = len(changed_wards) > 0
    return has_changed, changed_wards, unchanged_wards


def update_analytical_state_cache(all_ward_results: List[Dict[str, Any]]) -> None:
    """Updates the internal analytical state cache."""
    global _LAST_KNOWN_ANALYTICAL_STATE
    for ward in all_ward_results:
        ward_id = ward.get("ward_id")
        if ward_id:
            _LAST_KNOWN_ANALYTICAL_STATE[ward_id] = {
                "overall_severity": ward.get("overall_severity"),
                "worst_hazard": ward.get("worst_hazard"),
                "confidence": ward.get("confidence"),
                "hazards": {
                    h: {"score": info.get("score"), "severity": info.get("severity")}
                    for h, info in ward.get("hazards", {}).items()
                },
                "cached_at": datetime.now(timezone.utc).isoformat(),
            }


def reset_analytical_cache() -> None:
    """Resets the analytical cache for test isolation."""
    global _LAST_KNOWN_ANALYTICAL_STATE
    _LAST_KNOWN_ANALYTICAL_STATE.clear()


# ==============================================================================
# USER NOTIFICATION DISPATCH ORCHESTRATION
# ==============================================================================

def evaluate_registered_users_notifications(
    all_ward_results: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Evaluates registered active users/devices against the newly computed hazard zones.
    Reuses existing notification_service.py rules, geofencing, and deduplication.

    Returns:
        Dict summarizing users evaluated and alerts triggered.
    """
    # Convert ward results to map zones
    current_map_zones = map_zones.transform_engine_results_to_map_zones(all_ward_results)

    users_registry = notification_service._USER_REGISTRY
    evaluated_count = 0
    triggered_count = 0
    notifications_summary = []

    for user_key, user_data in users_registry.items():
        if not user_data.get("notification_enabled", True):
            continue

        u_lat = user_data.get("latitude")
        u_lon = user_data.get("longitude")
        if u_lat is None or u_lon is None:
            continue

        evaluated_count += 1
        res = notification_service.process_user_location_alert(
            user_id_or_device_id=user_data.get("user_id") or user_data.get("device_id", user_key),
            latitude=u_lat,
            longitude=u_lon,
            fcm_token=user_data.get("fcm_token"),
            phone_number=user_data.get("phone_number"),
            precomputed_zones=current_map_zones,
        )

        if res.get("notified"):
            triggered_count += 1
            notifications_summary.append({
                "user_id": user_key,
                "severity": res.get("severity"),
                "hazard_type": res.get("hazard_type"),
                "ward_id": res.get("ward_id"),
                "action": res.get("action"),
            })

    return {
        "users_evaluated": evaluated_count,
        "notifications_triggered": triggered_count,
        "details": notifications_summary,
    }


# ==============================================================================
# EXECUTION HEALTH TRACKING
# ==============================================================================

def record_execution_health(health_payload: Dict[str, Any]) -> None:
    """Updates the lightweight execution health record."""
    global _EXECUTION_HEALTH
    _EXECUTION_HEALTH.update(health_payload)


def get_execution_health() -> Dict[str, Any]:
    """Returns the current execution health status for monitoring/developer UI."""
    return dict(_EXECUTION_HEALTH)


# ==============================================================================
# MASTER PIPELINE ORCHESTRATOR
# ==============================================================================

def run_pipeline(
    force_run: bool = False,
    force_sync_db: bool = False,
    mock_scoring_results: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Executes a single 20-minute automated background run.

    Pipeline Steps:
    1. Acquire concurrency lock.
    2. Execute existing analytical risk engine (score_all_wards()).
    3. Detect meaningful changes against previous state.
    4. Synchronize changed risk zones to Appwrite TablesDB.
    5. Evaluate location-aware notifications for registered users.
    6. Record execution health metadata.
    7. Release concurrency lock and exit cleanly.

    Returns:
        Structured execution result dictionary.
    """
    start_time = time.time()
    now_utc = datetime.now(timezone.utc)
    next_expected = now_utc + timedelta(minutes=SCHEDULER_INTERVAL_MINUTES)

    # 1. Concurrency check
    if not acquire_execution_lock(caller_id="orchestrator"):
        msg = "Scheduled execution skipped: previous execution lock is still active."
        print(f"[SCHEDULER] {msg}")
        return {
            "status": "SKIPPED_LOCKED",
            "message": msg,
            "duration_ms": int((time.time() - start_time) * 1000),
        }

    try:
        print(f"\n[SCHEDULER] Starting automated risk execution pipeline at {now_utc.isoformat()}...")

        # 2. Run existing analytical engine (calling risk_engine.score_all_wards)
        weather_status = "SUCCESS"
        risk_status = "SUCCESS"
        error_summary = None

        if mock_scoring_results is not None:
            all_ward_results = mock_scoring_results
        else:
            try:
                all_ward_results = risk_engine.score_all_wards()
            except Exception as e:
                print(f"[SCHEDULER] Note: Risk engine execution encountered error (safe isolation): {e}")
                weather_status = "FAILED"
                risk_status = "FAILED"
                error_summary = f"Risk engine error: {str(e)}"
                all_ward_results = []

        if not all_ward_results:
            # Failure isolation: preserve existing valid state
            duration_ms = int((time.time() - start_time) * 1000)
            health = {
                "last_run_at": now_utc.isoformat(),
                "status": "PARTIAL_FAILURE" if weather_status == "FAILED" else "NO_DATA",
                "duration_ms": duration_ms,
                "risk_update_status": risk_status,
                "weather_status": weather_status,
                "notification_status": "SKIPPED",
                "zones_evaluated": 0,
                "zones_changed": 0,
                "notifications_evaluated": 0,
                "notifications_triggered": 0,
                "error_summary": error_summary,
                "next_expected_run": next_expected.isoformat(),
            }
            record_execution_health(health)
            return health

        # 3. Change detection
        has_changed, changed_wards, unchanged_wards = detect_meaningful_changes(all_ward_results)
        print(f"[SCHEDULER] Evaluated {len(all_ward_results)} wards. Meaningful changes detected in {len(changed_wards)} wards.")

        # 4. Appwrite DB Sync (only write when meaningful data changed or forced)
        db_sync_status = "SKIPPED_NO_CHANGE"
        if has_changed or force_sync_db:
            try:
                # Update Appwrite using existing risk_engine push function
                risk_engine.push_ward_results_to_appwrite(changed_wards if not force_sync_db else all_ward_results)
                db_sync_status = "SUCCESS"
            except Exception as e:
                print(f"[SCHEDULER] Note: Appwrite push failed gracefully: {e}")
                db_sync_status = "FAILED"

        # Update cache state
        update_analytical_state_cache(all_ward_results)

        # 5. Evaluate notifications for registered users
        notif_eval = evaluate_registered_users_notifications(all_ward_results)
        notif_status = "SUCCESS" if notif_eval["notifications_triggered"] > 0 else "NONE_REQUIRED"

        duration_ms = int((time.time() - start_time) * 1000)

        # 6. Record execution health
        health = {
            "last_run_at": now_utc.isoformat(),
            "status": "SUCCESS" if db_sync_status != "FAILED" else "PARTIAL_FAILURE",
            "duration_ms": duration_ms,
            "risk_update_status": "UPDATED" if has_changed else "NO_CHANGE",
            "db_sync_status": db_sync_status,
            "weather_status": weather_status,
            "notification_status": notif_status,
            "zones_evaluated": len(all_ward_results),
            "zones_changed": len(changed_wards),
            "notifications_evaluated": notif_eval["users_evaluated"],
            "notifications_triggered": notif_eval["notifications_triggered"],
            "error_summary": error_summary,
            "next_expected_run": next_expected.isoformat(),
            "schedule": SCHEDULER_CRON,
        }
        record_execution_health(health)
        print(f"[SCHEDULER] Completed execution in {duration_ms} ms. Status: {health['status']}. Next run: {health['next_expected_run']}")
        return health

    finally:
        # 7. Release lock safely
        release_execution_lock()


# ==============================================================================
# APPWRITE FUNCTION ENTRY POINT
# ==============================================================================

def main(
    context: Optional[Any] = None,
    mock_scoring_results: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Standard entry point conforming to Appwrite Functions (Open Runtimes).

    When invoked by Appwrite's 20-minute cron schedule, receives context object
    and returns JSON execution summary.
    """
    result = run_pipeline(mock_scoring_results=mock_scoring_results)

    if context is not None and hasattr(context, "res") and hasattr(context.res, "json"):
        return context.res.json(result)
    return result


if __name__ == "__main__":
    # Manual / CLI execution
    summary = run_pipeline(force_run=True)
    print("\nExecution Summary:")
    for k, v in summary.items():
        print(f"  {k}: {v}")

