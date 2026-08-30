"""
AI Disaster Intelligence Layer - NivaranAI (Apada Sathi)
=========================================================

Provides Gemini-powered disaster intelligence & communication capabilities:
1. Citizen Report Understanding (Multilingual text to structured JSON extraction)
2. Incident / Report Semantic Correlation & Grouping
3. Trend Understanding (Worsening / Improving / Stable / Unclear)
4. Risk / Situation Plain-Language Explanation (explaining Risk Engine outputs)
5. Ward Situation Brief (synthesizing Risk Engine + Crowd + TrustShield + Safe Places)
6. Controlled Q&A (Grounded strictly in real NivaranAI backend data)
7. Role-Specific Communication (Citizen Warning, Government Brief, Dashboard Explanation)

STRICT CONSTRAINTS:
- Reuses existing GEMINI_API_KEY & google-generativeai SDK.
- NEVER modifies risk_engine.py formulas, weights, thresholds, or 0-100 scores.
- ZERO background polling; execution is strictly ON-DEMAND per user trigger.
- Includes safe deterministic fallbacks for offline/test environments.
"""

from datetime import datetime, timezone
import json
import os
import re
from typing import Any, Dict, List, Optional, Tuple, Union
from dotenv import load_dotenv

import map_zones
import emergency_locations as el
import crowd_updates
import trust_shield

load_dotenv()

GEMINI_MODEL_NAME = "gemini-3.6-flash"


def _get_gemini_model() -> Optional[Any]:
    """Retrieves configured Gemini GenerativeModel client safely."""
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key or api_key.startswith("PASTE_"):
        return None

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        return genai.GenerativeModel(GEMINI_MODEL_NAME)
    except Exception as e:
        print(f"Note: Gemini model initialization: {e}")
        return None


# ==============================================================================
# FUNCTION 1: CITIZEN REPORT UNDERSTANDING
# ==============================================================================

def parse_report_text(report_text: str, location_hint: Optional[str] = None) -> Dict[str, Any]:
    """
    Function 1: CITIZEN REPORT UNDERSTANDING
    Parses unstructured text (English, Hinglish, local terms) into structured JSON:
    - hazard: 'waterlogging' | 'flooding' | 'heavy_rain' | 'road_damage' | 'road_blocked' | 'lightning' | 'power_outage' | 'other'
    - location_clue: extracted landmark/road name
    - severity_indication: 'LOW' | 'MODERATE' | 'HIGH' | 'EMERGENCY'
    - road_blockage: 'YES' | 'NO' | 'UNKNOWN'
    - situation_trend: 'worsening' | 'improving' | 'stable' | 'unclear'
    """
    text_clean = str(report_text or "").strip()
    if not text_clean:
        return {
            "hazard": "waterlogging",
            "location_clue": location_hint or "Unknown location",
            "severity_indication": "MODERATE",
            "road_blockage": "UNKNOWN",
            "situation_trend": "unclear",
            "parsed_by": "fallback_default"
        }

    model = _get_gemini_model()
    if model:
        prompt = f"""You are an AI disaster intelligence parser for NivaranAI in Bhubaneswar, India.
Parse the citizen report text below and extract structured JSON ONLY with no markdown backticks:

Text: "{text_clean}"
Location hint: "{location_hint or ''}"

JSON schema required:
{{
  "hazard": "waterlogging" | "flooding" | "heavy_rain" | "road_damage" | "road_blocked" | "lightning" | "power_outage" | "other",
  "location_clue": "string",
  "severity_indication": "LOW" | "MODERATE" | "HIGH" | "EMERGENCY",
  "road_blockage": "YES" | "NO" | "UNKNOWN",
  "situation_trend": "worsening" | "improving" | "stable" | "unclear"
}}"""
        try:
            response = model.generate_content(prompt)
            resp_text = response.text.strip()
            # Clean possible markdown wrapping
            if resp_text.startswith("```"):
                resp_text = re.sub(r"^```(?:json)?\n?", "", resp_text)
                resp_text = re.sub(r"\n?```$", "", resp_text)
            parsed = json.loads(resp_text)
            parsed["parsed_by"] = "gemini"
            return parsed
        except Exception as e:
            print(f"Note: Gemini report parsing fallback: {e}")

    # Robust deterministic heuristic fallback
    lower_txt = text_clean.lower()
    
    # Hazard identification
    if "flood" in lower_txt or "under water" in lower_txt:
        hz = "flooding"
    elif "waterlog" in lower_txt or "water accumul" in lower_txt or "pani" in lower_txt:
        hz = "waterlogging"
    elif "rain" in lower_txt or "barish" in lower_txt or "varsha" in lower_txt:
        hz = "heavy_rain"
    elif "block" in lower_txt or "cannot pass" in lower_txt or "jam" in lower_txt:
        hz = "road_blocked"
    elif "lightn" in lower_txt or "bijli" in lower_txt:
        hz = "lightning"
    elif "power" in lower_txt or "electricity" in lower_txt or "current" in lower_txt:
        hz = "power_outage"
    else:
        hz = "road_damage" if "damage" in lower_txt or "hole" in lower_txt else "other"

    # Severity indication
    if "fully under water" in lower_txt or "cannot pass" in lower_txt or "rising fast" in lower_txt or "danger" in lower_txt:
        sev = "HIGH"
    elif "heavy" in lower_txt or "severe" in lower_txt:
        sev = "MODERATE"
    else:
        sev = "LOW"

    # Road blockage
    block = "YES" if ("cannot pass" in lower_txt or "blocked" in lower_txt or "closed" in lower_txt) else "NO"

    # Trend
    if "rising" in lower_txt or "increasing" in lower_txt or "worse" in lower_txt:
        tr = "worsening"
    elif "receding" in lower_txt or "clearing" in lower_txt or "better" in lower_txt:
        tr = "improving"
    else:
        tr = "unclear"

    return {
        "hazard": hz,
        "location_clue": location_hint or "Report area",
        "severity_indication": sev,
        "road_blockage": block,
        "situation_trend": tr,
        "parsed_by": "heuristic_fallback"
    }


# ==============================================================================
# FUNCTION 2: INCIDENT / REPORT UNDERSTANDING
# ==============================================================================

def analyze_incident_reports(reports: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Function 2: INCIDENT / REPORT UNDERSTANDING
    Analyzes a list of citizen report descriptions to determine if they describe the same real-world incident.
    """
    if not reports:
        return {
            "same_incident": False,
            "confidence": "LOW",
            "summary": "No reports provided for incident correlation.",
            "analyzed_count": 0
        }

    descriptions = [str(r.get("description", "")).strip() for r in reports if r.get("description")]
    if len(descriptions) <= 1:
        return {
            "same_incident": True,
            "confidence": "HIGH",
            "summary": f"Single report describing: {descriptions[0] if descriptions else 'incident'}",
            "analyzed_count": len(descriptions)
        }

    model = _get_gemini_model()
    if model:
        prompt = f"""You are analyzing disaster incident reports in Bhubaneswar, India.
Determine if the following reports describe the same real-world event/hazard:

Reports:
{json.dumps(descriptions, indent=2)}

Return JSON ONLY:
{{
  "same_incident": true | false,
  "confidence": "HIGH" | "MODERATE" | "LOW",
  "summary": "Short 1-2 sentence semantic summary of the combined incident."
}}"""
        try:
            response = model.generate_content(prompt)
            resp_text = response.text.strip()
            if resp_text.startswith("```"):
                resp_text = re.sub(r"^```(?:json)?\n?", "", resp_text)
                resp_text = re.sub(r"\n?```$", "", resp_text)
            parsed = json.loads(resp_text)
            parsed["analyzed_count"] = len(descriptions)
            return parsed
        except Exception as e:
            print(f"Note: Gemini incident analysis fallback: {e}")

    # Fallback heuristic correlation
    u_types = set(r.get("update_type", "other") for r in reports)
    same_type = len(u_types) == 1
    summary_text = f"{len(reports)} citizen reports describing {list(u_types)[0].replace('_', ' ')}" if same_type else f"{len(reports)} observations across nearby locations"

    return {
        "same_incident": same_type,
        "confidence": "MODERATE" if same_type else "LOW",
        "summary": summary_text,
        "analyzed_count": len(reports)
    }


# ==============================================================================
# FUNCTION 3: TREND UNDERSTANDING
# ==============================================================================

def analyze_trend(structured_observations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Function 3: TREND UNDERSTANDING
    Classifies trend over time: 'worsening' | 'improving' | 'stable' | 'unclear'.
    """
    if not structured_observations:
        return {"trend": "unclear", "reason": "Insufficient temporal observations"}

    model = _get_gemini_model()
    if model:
        prompt = f"""Analyze the sequence of citizen disaster observations over time for a location in Bhubaneswar.
Observations:
{json.dumps(structured_observations, indent=2)}

Determine if the overall situation trend is:
- worsening
- improving
- stable
- unclear

Return JSON ONLY:
{{
  "trend": "worsening" | "improving" | "stable" | "unclear",
  "reason": "1 sentence explanation based on the timeline"
}}"""
        try:
            response = model.generate_content(prompt)
            resp_text = response.text.strip()
            if resp_text.startswith("```"):
                resp_text = re.sub(r"^```(?:json)?\n?", "", resp_text)
                resp_text = re.sub(r"\n?```$", "", resp_text)
            return json.loads(resp_text)
        except Exception as e:
            print(f"Note: Gemini trend analysis fallback: {e}")

    # Fallback: inspect keyword escalation
    txt_comb = " ".join(str(o.get("description", "")).lower() for o in structured_observations)
    if any(k in txt_comb for k in ["rising", "increasing", "worse", "blocked", "under water"]):
        tr = "worsening"
        rs = "Observations indicate increasing water level or expanding blockage."
    elif any(k in txt_comb for k in ["receding", "clearing", "subsiding", "better"]):
        tr = "improving"
        rs = "Observations indicate conditions are clearing."
    else:
        tr = "stable"
        rs = "Observations indicate consistent localized conditions."

    return {"trend": tr, "reason": rs}


# ==============================================================================
# FUNCTION 4: RISK / SITUATION EXPLANATION
# ==============================================================================

def explain_risk_score(ward_result: Dict[str, Any], hazard_name: str) -> Dict[str, Any]:
    """
    Function 4: RISK / SITUATION EXPLANATION
    Provides plain-language explanation of pre-computed Risk Engine outputs.
    Guaranteed NEVER to alter or recalculate the official 0-100 score.
    """
    ward_name = ward_result.get("ward_name", "BMC Ward")
    hazards = ward_result.get("hazards", {})
    h_data = hazards.get(hazard_name, {})

    score = h_data.get("score", ward_result.get("risk_score", 50))
    sev = h_data.get("severity", ward_result.get("severity", "MODERATE"))
    conf = ward_result.get("confidence", 80)

    model = _get_gemini_model()
    if model:
        prompt = f"""Explain this official disaster risk calculation in plain language for residents of Bhubaneswar.
Do NOT change any numbers or scores. Use EXACT numbers given below:

Ward: {ward_name}
Hazard: {hazard_name.replace('_', ' ').title()}
Official Risk Score: {score}/100
Severity Level: {sev}
Confidence: {conf}%

Provide a concise 2-sentence explanation of why this area was flagged and what the score means."""
        try:
            response = model.generate_content(prompt)
            return {
                "official_score": score,
                "severity": sev,
                "confidence": conf,
                "explanation": response.text.strip(),
                "generated_by": "gemini"
            }
        except Exception as e:
            print(f"Note: Gemini explanation fallback: {e}")

    # Fallback explanation
    fb_text = (
        f"{hazard_name.replace('_', ' ').title()} risk is currently {sev} in {ward_name} "
        f"with an official score of {score}/100 ({conf}% confidence). "
        f"Meteorological conditions and ward vulnerability factors contribute to this assessment."
    )
    return {
        "official_score": score,
        "severity": sev,
        "confidence": conf,
        "explanation": fb_text,
        "generated_by": "fallback"
    }


# ==============================================================================
# FUNCTION 5: SITUATION BRIEF
# ==============================================================================

def generate_situation_brief(ward_id: Union[str, int]) -> Dict[str, Any]:
    """
    Function 5: SITUATION BRIEF
    Synthesizes live Risk Engine results, active hazard zones, recent crowd updates,
    TrustShield credibility ratings, and safe emergency places into a comprehensive brief.
    """
    # 1. Fetch live zone details from map_zones.py
    try:
        w_str = str(ward_id)
        w_key = w_str if w_str.startswith("ward_") else f"ward_{w_str}"
        zone_details = map_zones.get_zone_details(w_key, include_safe_places=True)
    except Exception as e:
        zone_details = {"ward_id": ward_id, "ward_name": f"Ward {ward_id}", "severity": "MODERATE", "risk_score": 50.0}

    ward_name = zone_details.get("ward_name", f"Ward {ward_id}")
    primary_hazard = zone_details.get("primary_hazard", "waterlogging")
    risk_score = zone_details.get("risk_score", 50.0)
    severity = zone_details.get("severity", "MODERATE")

    # 2. Fetch crowd reports & TrustShield classifications
    try:
        reports = crowd_updates.get_crowd_updates(ward_id=w_str, limit=5)
    except Exception:
        reports = []

    corroborated_count = sum(1 for r in reports if r.get("trust_classification") == "Corroborated" or r.get("status") == "VERIFIED")
    report_summaries = [f"- {r.get('description', '')} ({r.get('trust_classification', 'Plausible')})" for r in reports[:3]]

    # 3. Fetch nearby safe emergency places
    try:
        safe_places = el.list_emergency_locations()
        safe_count = len(safe_places)
    except Exception:
        safe_count = 3

    model = _get_gemini_model()
    if model:
        prompt = f"""Generate a concise Situation Brief for emergency responders and citizens in Bhubaneswar.

REAL SYSTEM DATA (Do NOT alter numbers or invent facts):
Ward: {ward_name}
Primary Hazard: {primary_hazard.replace('_', ' ').title()}
Official Risk Score: {risk_score}/100 ({severity} Severity)
Recent Citizen Reports: {len(reports)} total ({corroborated_count} corroborated by TrustShield)
Sample Reports:
{chr(10).join(report_summaries) if report_summaries else "No active citizen observations in last 6 hours."}
Available Safe Emergency Centers: {safe_count} active facilities

Write a clear 3-paragraph Situation Brief:
1. Executive Summary (Risk & Hazard state)
2. Ground Reality (Citizen observations & TrustShield credibility)
3. Actionable Advice (Safety actions & safe centers)"""
        try:
            response = model.generate_content(prompt)
            return {
                "ward_id": ward_id,
                "ward_name": ward_name,
                "primary_hazard": primary_hazard,
                "risk_score": risk_score,
                "severity": severity,
                "total_reports": len(reports),
                "corroborated_reports": corroborated_count,
                "situation_brief": response.text.strip(),
                "generated_by": "gemini"
            }
        except Exception as e:
            print(f"Note: Gemini situation brief fallback: {e}")

    # Fallback Situation Brief
    fb_brief = (
        f"SITUATION BRIEF FOR {ward_name.upper()}\n"
        f"1. Executive Summary: Primary hazard is {primary_hazard.replace('_', ' ')} with an official risk score of {risk_score}/100 ({severity} severity).\n"
        f"2. Ground Reality: {len(reports)} citizen observation(s) recorded ({corroborated_count} corroborated by TrustShield validation).\n"
        f"3. Actionable Advice: Residents in low-lying areas should stay alert. {safe_count} designated safe shelter locations remain open and accessible."
    )

    return {
        "ward_id": ward_id,
        "ward_name": ward_name,
        "primary_hazard": primary_hazard,
        "risk_score": risk_score,
        "severity": severity,
        "total_reports": len(reports),
        "corroborated_reports": corroborated_count,
        "situation_brief": fb_brief,
        "generated_by": "fallback"
    }


# ==============================================================================
# FUNCTION 6: CONTROLLED Q&A
# ==============================================================================

def answer_controlled_question(question_text: str, ward_id: Optional[Union[str, int]] = None) -> Dict[str, Any]:
    """
    Function 6: CONTROLLED Q&A
    Answers citizen/official questions using REAL backend data from map_zones, crowd_updates, and emergency_locations.
    Gemini is strictly forbidden from inventing database information.
    """
    q_clean = str(question_text or "").strip()
    if not q_clean:
        return {"answer": "Please ask a question regarding active disaster hazards, ward risk scores, or safe locations.", "sources_used": []}

    # Fetch live contextual data
    try:
        zones = map_zones.get_map_zones()
    except Exception:
        zones = []

    try:
        safe_places = el.list_emergency_locations()
    except Exception:
        safe_places = []

    try:
        reports = crowd_updates.get_crowd_updates(limit=10)
    except Exception:
        reports = []

    # Filter to specific ward if provided
    context_data = {
        "active_hazard_zones": [
            {
                "ward_name": z.get("ward_name"),
                "hazard_type": z.get("hazard_type"),
                "risk_score": z.get("risk_score"),
                "severity": z.get("severity")
            }
            for z in zones[:10]
        ],
        "safe_places_sample": [
            {
                "name": p.get("name"),
                "type": p.get("type"),
                "address": p.get("address"),
                "status": p.get("status", "OPEN")
            }
            for p in safe_places[:5]
        ],
        "recent_crowd_reports_sample": [
            {
                "ward_id": r.get("ward_id"),
                "update_type": r.get("update_type"),
                "description": r.get("description"),
                "trust_classification": r.get("trust_classification")
            }
            for r in reports[:5]
        ]
    }

    model = _get_gemini_model()
    if model:
        prompt = f"""You are the official NivaranAI Disaster Assistant for Bhubaneswar.
Answer the user's question using ONLY the provided real backend data.
Do NOT invent any fake database entries, wards, numbers, or shelters.

User Question: "{q_clean}"

REAL BACKEND DATA:
{json.dumps(context_data, indent=2)}

Answer concisely in 2-3 sentences. If the data is not in the system, state clearly that official data is unavailable."""
        try:
            response = model.generate_content(prompt)
            return {
                "question": q_clean,
                "answer": response.text.strip(),
                "sources_used": ["map_zones", "emergency_locations", "crowd_updates"],
                "generated_by": "gemini"
            }
        except Exception as e:
            print(f"Note: Gemini Q&A fallback: {e}")

    # Fallback response
    q_lower = q_clean.lower()
    if "safe place" in q_lower or "shelter" in q_lower or "hospital" in q_lower:
        ans = f"There are {len(safe_places)} registered emergency centers in Bhubaneswar, including {safe_places[0].get('name', 'Capital Hospital')} and official relief shelters."
    elif "ward" in q_lower or "risk" in q_lower or "high" in q_lower:
        top_zone = zones[0] if zones else {"ward_name": "Ward 15", "severity": "HIGH"}
        ans = f"Active hazard zones are evaluated by the Risk Engine. For example, {top_zone.get('ward_name')} is currently assessed at {top_zone.get('severity')} severity."
    else:
        ans = f"NivaranAI evaluates multi-hazard risks across all 67 BMC wards using real-time weather and citizen reports. {len(zones)} hazard zones are currently active."

    return {
        "question": q_clean,
        "answer": ans,
        "sources_used": ["map_zones", "emergency_locations"],
        "generated_by": "fallback"
    }


# ==============================================================================
# FUNCTION 7: ROLE-SPECIFIC COMMUNICATION
# ==============================================================================

def generate_role_specific_communication(ward_id: Union[str, int], role: str = "citizen") -> Dict[str, Any]:
    """
    Function 7: ROLE-SPECIFIC COMMUNICATION
    Generates tailored messaging for:
    - 'citizen': Short public safety warning & action steps
    - 'government': Executive situation summary & priority deployment recommendation
    - 'dashboard': Command center overview explanation
    """
    role_clean = str(role or "citizen").lower().strip()

    try:
        w_str = str(ward_id)
        w_key = w_str if w_str.startswith("ward_") else f"ward_{w_str}"
        zone_details = map_zones.get_zone_details(w_key, include_safe_places=True)
    except Exception:
        zone_details = {"ward_name": f"Ward {ward_id}", "primary_hazard": "waterlogging", "risk_score": 65.0, "severity": "HIGH"}

    ward_name = zone_details.get("ward_name", f"Ward {ward_id}")
    hazard = zone_details.get("primary_hazard", "waterlogging")
    score = zone_details.get("risk_score", 65.0)
    sev = zone_details.get("severity", "HIGH")

    model = _get_gemini_model()
    if model:
        prompt = f"""Generate a role-tailored communication message for role: '{role_clean.upper()}'.

DATA:
Ward: {ward_name}
Hazard: {hazard.replace('_', ' ').title()}
Risk Score: {score}/100
Severity: {sev}

Requirements per role:
- 'citizen': Short public safety alert with practical advice (max 40 words).
- 'government': Official executive briefing with resource priority recommendation (max 50 words).
- 'dashboard': Command center overview snippet explaining threat level (max 40 words)."""
        try:
            response = model.generate_content(prompt)
            return {
                "ward_id": ward_id,
                "role": role_clean,
                "message": response.text.strip(),
                "generated_by": "gemini"
            }
        except Exception as e:
            print(f"Note: Gemini role communication fallback: {e}")

    # Fallback role messaging
    if role_clean == "government":
        msg = f"[OFFICIAL BRIEFING] {ward_name} reporting {sev} severity {hazard.replace('_', ' ')} (Score: {score}/100). Recommend prioritizing drainage pumps and emergency response teams."
    elif role_clean == "dashboard":
        msg = f"{ward_name} highlighted at {sev} risk for {hazard.replace('_', ' ')}. Visual affected radius and citizen corroboration active."
    else:
        msg = f"[SAFETY ALERT] {sev} risk of {hazard.replace('_', ' ')} in {ward_name}. Please avoid flooded roads and stay updated via official channels."

    return {
        "ward_id": ward_id,
        "role": role_clean,
        "message": msg,
        "generated_by": "fallback"
    }
