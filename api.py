import os
import json
import math
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS

import auth_service
import map_zones
import emergency_locations
import crowd_updates
import news_service
import scheduled_runner
import ai_disaster_intelligence
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Safely configure CORS
default_origins = "https://nivaran-ai-delta.vercel.app,http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:5173,http://127.0.0.1:5173"
allowed_origins_str = os.environ.get("ALLOWED_ORIGINS", default_origins)
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]
if "https://nivaran-ai-delta.vercel.app" not in allowed_origins:
    allowed_origins.append("https://nivaran-ai-delta.vercel.app")
CORS(app, origins=allowed_origins, supports_credentials=True)

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized"}), 401
        
        token = auth_header.split(" ")[1]
        session = auth_service.verify_session(token)
        if not session:
            return jsonify({"error": "Invalid or expired session"}), 401
            
        return f(session, *args, **kwargs)
    return decorated

def optional_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        session = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            session = auth_service.verify_session(token)
        return f(session, *args, **kwargs)
    return decorated

# ==========================================
# AUTHENTICATION
# ==========================================

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json or {}
    role = data.get("role", "CITIZEN")
    try:
        if role == "GOVERNMENT_OFFICIAL":
            result = auth_service.register_government_official_request(
                email=data.get("email", ""),
                password=data.get("password", ""),
                name=data.get("name", ""),
                department=data.get("department", ""),
                designation=data.get("designation", ""),
                employee_id=data.get("employee_id", "")
            )
        else:
            result = auth_service.register_citizen(
                name=data.get("name", ""),
                email=data.get("email", ""),
                password=data.get("password", ""),
                phone_number=data.get("phone_number")
            )
        status = result.get("status_code", 201) if isinstance(result, dict) else 201
        return jsonify(result), status
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/auth/google", methods=["POST"])
def google_auth():
    data = request.json or {}
    id_token = data.get("id_token")
    if not id_token:
        return jsonify({"error": "id_token required"}), 400
    try:
        result = auth_service.authenticate_google_user_from_token(id_token)
        status = result.get("status_code", 200) if isinstance(result, dict) else 200
        return jsonify(result), status
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json or {}
    try:
        session = auth_service.login_user(
            email=data.get("email", ""),
            password=data.get("password", "")
        )
        status = session.get("status_code", 200) if isinstance(session, dict) else 200
        return jsonify(session), status
    except Exception as e:
        return jsonify({"error": str(e)}), 401

@app.route("/api/auth/me", methods=["GET"])
@require_auth
def get_me(session):
    profile = auth_service.get_user_profile(session.get("user_id"))
    if not profile:
        return jsonify({"error": "Profile not found"}), 404
    return jsonify(profile), 200

# ==========================================
# HAZARD ZONES (Map)
# ==========================================

@app.route("/api/hazards", methods=["GET"])
def get_hazards():
    try:
        zones = map_zones.get_map_zones()
        return jsonify(zones), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/evaluate-location", methods=["POST"])
def evaluate_location():
    data = request.json or {}
    lat = data.get("latitude")
    lng = data.get("longitude")
    if lat is None or lng is None:
        return jsonify({"error": "latitude and longitude required"}), 400
    try:
        res = map_zones.evaluate_user_location(float(lat), float(lng))
        return jsonify(res), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# SAFE PLACES & CAMPS
# ==========================================

@app.route("/api/safe-places", methods=["GET"])
def get_safe_places():
    try:
        places = emergency_locations.list_emergency_locations()
        return jsonify(places), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/camps", methods=["POST"])
@require_auth
def create_camp(session):
    if session.get("role") != "GOVERNMENT_OFFICIAL":
        return jsonify({"error": "Forbidden"}), 403
    
    data = request.json or {}
    try:
        camp = auth_service.create_government_camp(
            official_user_id_or_token=session.get("user_id"),
            name=data.get("name", ""),
            latitude=float(data.get("latitude", 0.0)),
            longitude=float(data.get("longitude", 0.0)),
            address=data.get("address", ""),
            capacity=int(data.get("total_capacity", data.get("capacity", 0))),
            ward_id=str(data.get("ward_id", "")),
            hazard_type=data.get("type", "all"),
            contact_information=data.get("contact_number", data.get("contact_information", ""))
        )
        status = camp.get("status_code", 201) if isinstance(camp, dict) else 201
        return jsonify(camp), status
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/camps/<camp_id>/capacity", methods=["PUT"])
@require_auth
def update_camp_capacity(session, camp_id):
    if session.get("role") != "GOVERNMENT_OFFICIAL":
        return jsonify({"error": "Forbidden"}), 403
        
    data = request.json or {}
    try:
        camp = auth_service.update_government_camp(
            official_user_id_or_token=session.get("user_id"),
            camp_id=camp_id,
            occupied_capacity=data.get("occupied_capacity"),
            total_capacity=data.get("total_capacity"),
            status=data.get("status")
        )
        status_code = camp.get("status_code", 200) if isinstance(camp, dict) else 200
        return jsonify(camp), status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# ==========================================
# CROWD REPORTS
# ==========================================

@app.route("/api/reports", methods=["GET"])
def get_reports():
    try:
        reports = crowd_updates.get_crowd_updates()
        return jsonify(reports), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/reports", methods=["POST"])
@optional_auth
def submit_report(session):
    data = request.json or {}
    try:
        desc = str(data.get("description") or "").strip()
        if not desc:
            return jsonify({"error": "Description is required"}), 400

        obs_type = str(data.get("observation_type") or data.get("update_type") or "flooding").lower().strip()
        if obs_type not in crowd_updates.VALID_UPDATE_TYPES:
            obs_type = "waterlogging" if "water" in obs_type else "flooding"

        responses = data.get("responses", {})
        answer = data.get("answer") or (responses.get(obs_type) if isinstance(responses, dict) else None) or data.get("waterlogging_present") or "YES"
        user_id = (session.get("user_id") if (session and isinstance(session, dict)) else None) or data.get("reported_by_name") or "Citizen Reporter"

        try:
            lat = float(data.get("latitude", 20.2961))
            if math.isnan(lat) or lat < -90 or lat > 90:
                lat = 20.2961
        except (ValueError, TypeError):
            lat = 20.2961

        try:
            lng = float(data.get("longitude", 85.8245))
            if math.isnan(lng) or lng < -180 or lng > 180:
                lng = 85.8245
        except (ValueError, TypeError):
            lng = 85.8245

        report = crowd_updates.submit_crowd_update(
            latitude=lat,
            longitude=lng,
            update_type=obs_type,
            answer=answer,
            description=desc,
            photo_url=data.get("photo_url", ""),
            user_id=user_id,
            ward_id=str(data.get("ward_id")) if data.get("ward_id") else None
        )

        # Preserve rich survey attributes for frontend context & triage desk
        report["reported_by_name"] = data.get("reported_by_name") or (session.get("name") if session else "Citizen Reporter")
        report["waterlogging_present"] = data.get("waterlogging_present", "YES")
        report["waterlogging_depth_cm"] = data.get("waterlogging_depth_cm", 25)
        report["road_passable"] = data.get("road_passable", "NO")
        report["power_outage"] = data.get("power_outage", "YES")
        report["structural_damage"] = data.get("structural_damage", "NO")
        report["ward_name"] = data.get("ward_name") or f"Ward {data.get('ward_id', 1)}"

        return jsonify(report), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/reports/<report_id>/verify", methods=["POST"])
@require_auth
def verify_report(session, report_id):
    if session.get("role") != "GOVERNMENT_OFFICIAL":
        return jsonify({"error": "Forbidden"}), 403
        
    data = request.json or {}
    try:
        report = crowd_updates.verify_crowd_update(
            update_id=report_id,
            status=data.get("new_state", "VERIFIED"),
            verified_by=session.get("name", "Authorized BMC Official"),
            official_remarks=data.get("official_note") or data.get("official_remarks")
        )
        return jsonify(report), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/reports/<report_id>/corroborate", methods=["POST"])
@require_auth
def corroborate_report(session, report_id):
    try:
        report = crowd_updates.confirm_crowd_update(
            update_id=report_id
        )
        return jsonify(report), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# ==========================================
# OFFICIAL UPDATES
# ==========================================

@app.route("/api/official-updates", methods=["GET"])
def get_official_updates():
    try:
        updates = auth_service.get_active_field_updates()
        return jsonify(updates), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/official-updates", methods=["POST"])
@require_auth
def submit_official_update(session):
    if session.get("role") != "GOVERNMENT_OFFICIAL":
        return jsonify({"error": "Forbidden"}), 403
        
    data = request.json or {}
    try:
        update = auth_service.submit_official_field_update(
            official_user_id_or_token=session.get("user_id"),
            ward_id=data.get("ward_id"),
            hazard_type=data.get("hazard_type"),
            official_status=data.get("mitigation_status"),
            reason=data.get("action_taken") or data.get("official_note", ""),
            valid_hours=int(data.get("duration_hours", 6))
        )
        status_code = update.get("status_code", 201) if isinstance(update, dict) else 201
        return jsonify(update), status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# ==========================================
# NEWS
# ==========================================

@app.route("/api/news", methods=["GET"])
def get_news():
    locality = request.args.get("locality")
    ward_id = request.args.get("ward_id")
    try:
        if locality:
            news = news_service.get_news_by_locality(locality)
        elif ward_id:
            news = news_service.get_news_for_ward(ward_id)
        else:
            news = news_service.get_citywide_news()
        return jsonify(news), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# ADMIN & TELEMETRY
# ==========================================

@app.route("/api/admin/telemetry", methods=["GET"])
@require_auth
def get_telemetry(session):
    if session.get("role") not in ["SYSTEM_ADMIN", "GOVERNMENT_OFFICIAL"]:
        return jsonify({"error": "Forbidden"}), 403
        
    try:
        health = scheduled_runner.get_execution_health()
        return jsonify(health), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/users", methods=["GET"])
@require_auth
def get_users(session):
    if session.get("role") != "SYSTEM_ADMIN":
        return jsonify({"error": "Forbidden"}), 403
    
    try:
        users = [
            auth_service._sanitize_user_profile(user)
            for user in auth_service._USER_DATABASE.values()
            if isinstance(user, dict)
        ]
        return jsonify(users), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/users/<user_id>/approval", methods=["PUT"])
@require_auth
def update_user_approval(session, user_id):
    if session.get("role") != "SYSTEM_ADMIN":
        return jsonify({"error": "Forbidden"}), 403
        
    data = request.json or {}
    status_input = str(data.get("status", "")).upper().strip()
    
    try:
        if status_input in ["APPROVED", "ACTIVE"]:
            result = auth_service.admin_approve_official(
                admin_user_id=session.get("user_id"),
                official_user_id=user_id
            )
        elif status_input in ["SUSPENDED", "REJECTED"]:
            result = auth_service.admin_suspend_official(
                admin_user_id=session.get("user_id"),
                official_user_id=user_id,
                reason=data.get("reason", "Admin status update")
            )
        else:
            return jsonify({"error": f"Invalid approval status: {status_input}"}), 400
            
        status_code = result.get("status_code", 200) if isinstance(result, dict) else 200
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/admin/audit-logs", methods=["GET"])
@require_auth
def get_audit_logs(session):
    if session.get("role") not in ["SYSTEM_ADMIN", "GOVERNMENT_OFFICIAL"]:
        return jsonify({"error": "Forbidden"}), 403
        
    try:
        logs = auth_service.get_audit_logs(limit=50)
        return jsonify(logs), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# AI DISASTER INTELLIGENCE LAYER
# ==========================================

@app.route("/api/ai/parse-report", methods=["POST"])
def ai_parse_report():
    data = request.json or {}
    text = data.get("text") or data.get("description", "")
    location_hint = data.get("location_hint") or data.get("ward_name")
    try:
        parsed = ai_disaster_intelligence.parse_report_text(text, location_hint)
        return jsonify(parsed), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/ai/analyze-incident", methods=["POST"])
def ai_analyze_incident():
    data = request.json or {}
    reports = data.get("reports", [])
    try:
        analysis = ai_disaster_intelligence.analyze_incident_reports(reports)
        return jsonify(analysis), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/ai/situation-brief", methods=["GET"])
def ai_situation_brief():
    ward_id = request.args.get("ward_id", "ward_1")
    try:
        brief = ai_disaster_intelligence.generate_situation_brief(ward_id)
        return jsonify(brief), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/ai/ask", methods=["POST"])
def ai_ask_question():
    data = request.json or {}
    question = data.get("question", "")
    ward_id = data.get("ward_id")
    try:
        res = ai_disaster_intelligence.answer_controlled_question(question, ward_id)
        return jsonify(res), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/ai/role-summary", methods=["GET"])
def ai_role_summary():
    ward_id = request.args.get("ward_id", "ward_1")
    role = request.args.get("role", "citizen")
    try:
        summary = ai_disaster_intelligence.generate_role_specific_communication(ward_id, role)
        return jsonify(summary), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
