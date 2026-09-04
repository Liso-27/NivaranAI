"""
Apada Sathi - Disaster News Integration Backend Service
========================================================

Retrieves, filters, categorizes, and localizes real-time and recent news
from News API for Bhubaneswar and Odisha multi-hazard intelligence.

Key Features:
1. Secure News API integration using NEWS_API_KEY from .env
2. Transparent Multi-Hazard Classification (heavy_rainfall, flood, waterlogging,
   lightning, cyclone)
3. Strict Locality & Ward Resolution (e.g., Kalinga Nagar, Baramunda, Bomikhal,
   Nayapalli, Patia, Chandrasekharpur) vs CITYWIDE / REGIONAL scope
4. Map-Zone Contextual Integration (associates relevant news with existing hazard zones)
5. Continuous Moving News Ticker Data Feed
6. Original Publisher URL Preservation for [READ ORIGINAL ARTICLE]
7. In-Memory Caching with configurable TTL and rate-limit resilience
8. Transparent Informational Relevance Ranking (0-100)

CRITICAL ARCHITECTURAL CONSTRAINTS:
- risk_engine.py is the HEART of the system and is NEVER modified.
- News is an INFORMATION-ONLY supporting layer.
- News NEVER alters risk scores, severities, confidences, or affected radii.
- Fully provider-independent with graceful offline/error fallback.
"""

from datetime import datetime, timezone
import hashlib
import os
import re
import time
from typing import Any, Dict, List, Optional, Set, Tuple, Union
import requests
from dotenv import load_dotenv

import risk_engine
import map_zones

load_dotenv()

# ==============================================================================
# CONFIGURATION & CONSTANTS
# ==============================================================================

NEWS_API_KEY = os.environ.get("NEWS_API_KEY")
NEWS_API_BASE_URL = "https://newsapi.org/v2"

# Cache time-to-live in seconds (default: 15 minutes)
CACHE_TTL_SECONDS = int(os.environ.get("NEWS_CACHE_TTL_SECONDS", 900))
REQUEST_TIMEOUT_SECONDS = 8

# Supported multi-hazard categories
VALID_HAZARDS = {"heavy_rainfall", "flood", "waterlogging", "lightning", "cyclone"}

# Comprehensive Bhubaneswar Locality Knowledge Base
# Maps locality names and aliases to canonical names and representative BMC Ward IDs
LOCALITY_WARD_MAP: Dict[str, Dict[str, Any]] = {
    "kalinga nagar": {"canonical": "Kalinga Nagar", "ward_id": "ward_23"},
    "kalinganagar": {"canonical": "Kalinga Nagar", "ward_id": "ward_23"},
    "baramunda": {"canonical": "Baramunda", "ward_id": "ward_24"},
    "bomikhal": {"canonical": "Bomikhal", "ward_id": "ward_32"},
    "rasulgarh": {"canonical": "Rasulgarh", "ward_id": "ward_18"},
    "nayapalli": {"canonical": "Nayapalli", "ward_id": "ward_15"},
    "saheed nagar": {"canonical": "Saheed Nagar", "ward_id": "ward_30"},
    "sahid nagar": {"canonical": "Saheed Nagar", "ward_id": "ward_30"},
    "patia": {"canonical": "Patia", "ward_id": "ward_3"},
    "kiit": {"canonical": "Patia", "ward_id": "ward_3"},
    "infocity": {"canonical": "Patia", "ward_id": "ward_3"},
    "chandrasekharpur": {"canonical": "Chandrasekharpur", "ward_id": "ward_8"},
    "cs pur": {"canonical": "Chandrasekharpur", "ward_id": "ward_8"},
    "jayadev vihar": {"canonical": "Jayadev Vihar", "ward_id": "ward_16"},
    "jaydev vihar": {"canonical": "Jayadev Vihar", "ward_id": "ward_16"},
    "khandagiri": {"canonical": "Khandagiri", "ward_id": "ward_22"},
    "old town": {"canonical": "Old Town", "ward_id": "ward_58"},
    "lingaraj": {"canonical": "Old Town", "ward_id": "ward_58"},
    "mancheswar": {"canonical": "Mancheswar", "ward_id": "ward_18"},
    "palasuni": {"canonical": "Palasuni", "ward_id": "ward_18"},
    "jharpada": {"canonical": "Jharpada", "ward_id": "ward_33"},
    "laxmisagar": {"canonical": "Laxmisagar", "ward_id": "ward_33"},
    "acharyavihar": {"canonical": "Acharya Vihar", "ward_id": "ward_29"},
    "acharya vihar": {"canonical": "Acharya Vihar", "ward_id": "ward_29"},
    "vani vihar": {"canonical": "Vani Vihar", "ward_id": "ward_29"},
    "pokhariput": {"canonical": "Pokhariput", "ward_id": "ward_62"},
    "aerodrome": {"canonical": "Pokhariput", "ward_id": "ward_62"},
    "badagada": {"canonical": "Badagada", "ward_id": "ward_56"},
    "tankapani": {"canonical": "Badagada", "ward_id": "ward_56"},
    "ghatikia": {"canonical": "Ghatikia", "ward_id": "ward_22"},
    "sum hospital": {"canonical": "Ghatikia", "ward_id": "ward_22"},
    "master canteen": {"canonical": "Master Canteen", "ward_id": "ward_40"},
    "unit 1": {"canonical": "Unit Area", "ward_id": "ward_40"},
    "unit 2": {"canonical": "Unit Area", "ward_id": "ward_40"},
    "unit 3": {"canonical": "Unit Area", "ward_id": "ward_40"},
    "unit 4": {"canonical": "Unit Area", "ward_id": "ward_40"},
    "unit 6": {"canonical": "Unit Area", "ward_id": "ward_40"},
    "unit 8": {"canonical": "Unit Area", "ward_id": "ward_40"},
    "unit 9": {"canonical": "Unit Area", "ward_id": "ward_40"},
    "damana": {"canonical": "Damana", "ward_id": "ward_6"},
    "sailashree vihar": {"canonical": "Sailashree Vihar", "ward_id": "ward_7"},
    "niladri vihar": {"canonical": "Niladri Vihar", "ward_id": "ward_7"},
    "bapuji nagar": {"canonical": "Bapuji Nagar", "ward_id": "ward_40"},
    "tamando": {"canonical": "Tamando", "ward_id": "ward_67"},
    "dumduma": {"canonical": "Dumduma", "ward_id": "ward_64"},
}

# Hazard keyword lexicon for transparent NLP categorization
HAZARD_KEYWORDS: Dict[str, List[str]] = {
    "heavy_rainfall": [
        "heavy rain", "heavy rainfall", "downpour", "torrential", "rainfall",
        "monsoon rain", "cloudburst", "incessant rain", "wet spell", "heavy showers",
        "intense rainfall", "monsoon shower", "rain lashes", "rain batter"
    ],
    "flood": [
        "flood", "flooding", "inundated", "inundation", "submerged", "deluge",
        "water rise", "river overflow", "embankment breach", "flash flood",
        "flood waters", "flood situation", "flood alert", "flood relief", "marooned"
    ],
    "waterlogging": [
        "waterlogging", "waterlogged", "water-logged", "street water",
        "water accumulation", "water stagnation", "drain overflow", "sewage overflow",
        "urban flooding", "clogged drains", "submerged roads", "traffic stranded",
        "knee deep water", "waist deep water"
    ],
    "lightning": [
        "lightning", "thunderbolt", "thunderstorm", "lightening", "strike killed",
        "thunder strike", "electrocution storm", "lightning strike", "thunder and lightning"
    ],
    "cyclone": [
        "cyclone", "gale", "severe storm", "deep depression", "squall", "wind gust",
        "landfall", "super cyclone", "cyclonic storm", "cyclone warning", "low pressure"
    ],
}

# Secondary hazard compatibility mapping (e.g. heavy rain often co-occurs with waterlogging/flood)
HAZARD_COMPATIBILITY: Dict[str, Set[str]] = {
    "heavy_rainfall": {"heavy_rainfall", "waterlogging", "flood"},
    "flood": {"flood", "heavy_rainfall", "waterlogging"},
    "waterlogging": {"waterlogging", "heavy_rainfall", "flood"},
    "lightning": {"lightning", "heavy_rainfall"},
    "cyclone": {"cyclone", "heavy_rainfall", "flood"},
}

# ==============================================================================
# IN-MEMORY CACHE
# ==============================================================================

_NEWS_CACHE: Dict[str, Any] = {
    "articles": [],
    "last_fetched_timestamp": 0.0,
    "last_query": "",
}


# ==============================================================================
# LOCALITY & SCOPE RESOLUTION
# ==============================================================================

def resolve_locality_and_scope(text: str) -> Tuple[Optional[str], Optional[str], str]:
    """
    Identifies whether text mentions a specific Bhubaneswar locality/ward
    or represents a general citywide/regional disaster news item.

    Returns:
        (matched_locality: str | None, matched_ward_id: str | None, location_scope: str)
        where location_scope is 'LOCALITY', 'CITYWIDE', or 'REGIONAL'.
    """
    text_lower = text.lower()

    # 1. Check for explicit ward mentions like "Ward 23" or "ward_23"
    ward_match = re.search(r'\bward[_\s]+(\d{1,2})\b', text_lower)
    if ward_match:
        w_num = int(ward_match.group(1))
        if 1 <= w_num <= 67:
            w_id = f"ward_{w_num}"
            w_canonical = risk_engine.WARD_DATA.get(w_id, {}).get("name", f"Ward {w_num}")
            return w_canonical, w_id, "LOCALITY"

    # 2. Check for known locality names using word boundary regex
    for loc_key, loc_info in LOCALITY_WARD_MAP.items():
        # Match whole phrase/word
        pattern = r'\b' + re.escape(loc_key) + r'\b'
        if re.search(pattern, text_lower):
            return loc_info["canonical"], loc_info.get("ward_id"), "LOCALITY"

    # 3. Check for Bhubaneswar citywide keywords
    citywide_keywords = ["bhubaneswar", "cuttack", "khordha", "khurda", "bmc", "smart city"]
    for cw in citywide_keywords:
        if re.search(r'\b' + re.escape(cw) + r'\b', text_lower):
            return "Bhubaneswar", None, "CITYWIDE"

    # 4. Check for Odisha regional keywords
    regional_keywords = ["odisha", "orissa", "coastal odisha", "special relief commissioner", "src odisha"]
    for reg in regional_keywords:
        if re.search(r'\b' + re.escape(reg) + r'\b', text_lower):
            return "Odisha", None, "REGIONAL"

    # Default scope if unclassified
    return None, None, "CITYWIDE"


# ==============================================================================
# HAZARD CLASSIFICATION ENGINE
# ==============================================================================

def classify_hazard_type(title: str, description: str = "") -> Tuple[str, List[str]]:
    """
    Determines the most relevant hazard category from the article text using
    transparent keyword matching.

    Returns:
        (primary_hazard: str, matching_keywords: list)
    """
    combined_text = f"{title} {title} {title} {description}".lower()  # Title weighted 3x

    hazard_scores: Dict[str, int] = {h: 0 for h in HAZARD_KEYWORDS}
    matched_words: List[str] = []

    for hazard, keywords in HAZARD_KEYWORDS.items():
        for kw in keywords:
            count = len(re.findall(r'\b' + re.escape(kw) + r'\b', combined_text))
            if count > 0:
                hazard_scores[hazard] += count
                matched_words.append(kw)

    # Determine hazard with highest keyword score
    best_hazard = max(hazard_scores, key=hazard_scores.get)
    if hazard_scores[best_hazard] > 0:
        return best_hazard, list(set(matched_words))

    # General disaster fallback
    if any(k in combined_text for k in ["disaster", "warning", "alert", "emergency", "damage"]):
        return "heavy_rainfall", ["disaster alert"]

    return "heavy_rainfall", []


# ==============================================================================
# RELEVANCE SCORING
# ==============================================================================

def calculate_news_relevance(
    title: str,
    description: str,
    hazard_type: str,
    location_scope: str,
    matched_locality: Optional[str],
    published_at: Optional[str] = None,
) -> int:
    """
    Computes an informational ranking score (0-100) to order articles by relevance.

    IMPORTANT:
    This relevance score is an informational UI ranking metric ONLY.
    It does NOT touch or modify any risk score or risk engine formula.

    Scoring Factors:
    - Locality match: +35 pts
    - Explicit Bhubaneswar match: +20 pts
    - Title hazard keyword: +25 pts
    - Description hazard keyword: +10 pts
    - Recency decay: fresh articles (<48h) receive full bonus; older articles decay slightly
    """
    score = 20  # Base score

    # Locality precision bonus
    if location_scope == "LOCALITY" and matched_locality:
        score += 35
    elif location_scope == "CITYWIDE":
        score += 20
    elif location_scope == "REGIONAL":
        score += 10

    # Keyword presence in title
    title_lower = title.lower()
    desc_lower = description.lower() if description else ""

    hazard_kws = HAZARD_KEYWORDS.get(hazard_type, [])
    if any(kw in title_lower for kw in hazard_kws):
        score += 25
    elif any(kw in desc_lower for kw in hazard_kws):
        score += 10

    # Bhubaneswar direct mention
    if "bhubaneswar" in title_lower or "bhubaneswar" in desc_lower:
        score += 10

    # Recency check
    if published_at:
        try:
            clean_ts = published_at.replace("Z", "+00:00")
            pub_dt = datetime.fromisoformat(clean_ts).astimezone(timezone.utc)
            now_dt = datetime.now(timezone.utc)
            age_hours = (now_dt - pub_dt).total_seconds() / 3600.0

            if age_hours <= 24:
                score += 10
            elif age_hours <= 72:
                score += 5
            elif age_hours > 168:
                score -= 15
        except Exception:
            pass

    return max(10, min(100, score))


# ==============================================================================
# NEWS ARTICLE NORMALIZATION & DEDUPLICATION
# ==============================================================================

def normalize_news_article(raw_article: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Converts a raw News API article response into a standardized Apada Sathi
    news entity conforming to the required data structure.
    Enforces strict local relevance filter (must contain 'Bhubaneswar' or 'BBSR').
    """
    title = str(raw_article.get("title", "")).strip()
    if not title or title.lower() == "[removed]":
        return None

    url = str(raw_article.get("url", "")).strip()
    if not url:
        return None

    description = str(raw_article.get("description") or raw_article.get("content") or "").strip()
    content = str(raw_article.get("content") or "").strip()

    # Strict Bhubaneswar geographic text relevance check (title, description, or content)
    full_text = f"{title} {description} {content}".lower()
    if "bhubaneswar" not in full_text and "bbsr" not in full_text:
        return None

    # Disaster / Weather / Hazard relevance check
    disaster_kws = {
        "disaster", "flood", "floods", "flooding", "waterlogging", "waterlogged",
        "rainfall", "rain", "rains", "lightning", "thunderstorm", "cyclone",
        "storm", "wind", "winds", "inundation", "inundated", "rescue", "evacuation",
        "downpour", "weather", "monsoon", "squall", "alert", "warning", "emergency",
        "landslide", "damage", "relief", "marooned"
    }
    if not any(kw in full_text for kw in disaster_kws):
        return None

    # Clean News API truncation artifacts (e.g. [+1234 chars])
    description = re.sub(r'\[\+\d+\s+chars\]', '', description).strip()

    # Source Name
    source_obj = raw_article.get("source") or {}
    source_name = source_obj.get("name") if isinstance(source_obj, dict) else str(source_obj)
    if not source_name or source_name == "None":
        source_name = "News Outlet"

    image_url = raw_article.get("urlToImage") or raw_article.get("image_url")
    published_at = raw_article.get("publishedAt") or datetime.now(timezone.utc).isoformat()

    # Determine hazard type
    hazard_type, _ = classify_hazard_type(title, description)

    # Determine locality and scope
    matched_locality, matched_ward_id, location_scope = resolve_locality_and_scope(full_text)

    # Calculate informational relevance
    relevance_score = calculate_news_relevance(
        title=title,
        description=description,
        hazard_type=hazard_type,
        location_scope=location_scope,
        matched_locality=matched_locality,
        published_at=published_at,
    )

    # Deterministic unique ID using MD5 of URL
    article_id = hashlib.md5(url.encode("utf-8")).hexdigest()

    return {
        "id": article_id,
        "title": title,
        "description": description,
        "source_name": source_name,
        "url": url,
        "image_url": image_url,
        "published_at": published_at,
        "hazard_type": hazard_type,
        "matched_locality": matched_locality,
        "matched_ward_id": matched_ward_id,
        "location_scope": location_scope,
        "relevance_score": relevance_score,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


# ==============================================================================
# NEWS API FETCHER & CACHE MANAGER
# ==============================================================================

def fetch_raw_news_from_api(query: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Communicates with News API to retrieve relevant disaster articles for Bhubaneswar/Odisha.
    Handles API rate-limiting, timeouts, and network exceptions safely.
    """
    if not NEWS_API_KEY:
        print("Note: NEWS_API_KEY not found in environment.")
        return []

    # Focused Boolean search query for Bhubaneswar disaster intelligence
    search_query = query or (
        '("Bhubaneswar" OR "BBSR") AND '
        '(disaster OR flood OR flooding OR waterlogging OR rainfall OR rain OR lightning OR thunderstorm OR cyclone OR storm OR wind OR inundation OR rescue OR evacuation)'
    )

    endpoint = f"{NEWS_API_BASE_URL}/everything"
    params = {
        "q": search_query,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 50,
        "apiKey": NEWS_API_KEY,
    }

    try:
        response = requests.get(
            endpoint,
            params=params,
            timeout=REQUEST_TIMEOUT_SECONDS,
            headers={"User-Agent": "ApadaSathi-Backend/2.0"},
        )

        if response.status_code == 200:
            data = response.json()
            return data.get("articles", [])
        elif response.status_code in (426, 429):
            print(f"Note: News API rate limit or plan limit reached (HTTP {response.status_code}).")
            return []
        else:
            print(f"Note: News API returned HTTP {response.status_code}: {response.text[:200]}")
            return []
    except Exception as e:
        print(f"Note: News API request failed gracefully: {e}")
        return []


def get_cached_or_fresh_news(force_refresh: bool = False) -> List[Dict[str, Any]]:
    """
    Returns cached news articles if available and within CACHE_TTL_SECONDS.
    Otherwise, fetches fresh articles from News API and refreshes cache.
    """
    global _NEWS_CACHE
    now = time.time()

    is_cache_valid = (
        not force_refresh
        and len(_NEWS_CACHE["articles"]) > 0
        and (now - _NEWS_CACHE["last_fetched_timestamp"]) < CACHE_TTL_SECONDS
    )

    if is_cache_valid:
        return _NEWS_CACHE["articles"]

    # Fetch from API
    raw_articles = fetch_raw_news_from_api()
    processed_articles = []
    seen_urls: Set[str] = set()

    for raw in raw_articles:
        norm = normalize_news_article(raw)
        if norm and norm["url"] not in seen_urls:
            seen_urls.add(norm["url"])
            processed_articles.append(norm)

    # Sort by relevance and published date
    processed_articles.sort(
        key=lambda a: (a.get("relevance_score", 0), a.get("published_at", "")),
        reverse=True,
    )

    if processed_articles:
        _NEWS_CACHE["articles"] = processed_articles
        _NEWS_CACHE["last_fetched_timestamp"] = now

    return _NEWS_CACHE["articles"]


def set_mock_news_cache(articles: List[Dict[str, Any]]) -> None:
    """Helper to inject articles into cache for offline testing or deterministic tests."""
    global _NEWS_CACHE
    _NEWS_CACHE["articles"] = articles
    _NEWS_CACHE["last_fetched_timestamp"] = time.time()


# ==============================================================================
# NEWS FILTERING & QUERY ENDPOINTS
# ==============================================================================

def get_latest_news(
    limit: int = 20,
    hazard_type: Optional[str] = None,
    locality: Optional[str] = None,
    ward_id: Optional[str] = None,
    location_scope: Optional[str] = None,
    allow_compatible_hazards: bool = False,
    force_refresh: bool = False,
    sample_articles: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """
    Primary endpoint for retrieving the filtered news feed.

    Parameters:
        limit: Max number of articles to return
        hazard_type: 'heavy_rainfall'|'flood'|'waterlogging'|'lightning'|'cyclone'
        locality: e.g. 'Kalinga Nagar', 'Baramunda'
        ward_id: e.g. 'ward_23'
        location_scope: 'LOCALITY'|'CITYWIDE'|'REGIONAL'
        allow_compatible_hazards: If True, also includes secondary compatible hazards
        force_refresh: Force immediate cache bypass
        sample_articles: Optional direct article list for unit testing

    Returns:
        List of standardized news entities.
    """
    articles = sample_articles if sample_articles is not None else get_cached_or_fresh_news(force_refresh=force_refresh)

    filtered = []
    for a in articles:
        # Hazard filter
        if hazard_type and hazard_type != "all":
            h_req = str(hazard_type).lower().strip()
            a_hazard = a.get("hazard_type", "")
            if allow_compatible_hazards:
                compatible = HAZARD_COMPATIBILITY.get(h_req, {h_req})
                if a_hazard not in compatible and a_hazard != h_req:
                    continue
            else:
                if a_hazard != h_req:
                    continue

        # Locality filter
        if locality:
            loc_req = str(locality).lower().strip()
            a_loc = str(a.get("matched_locality", "")).lower()
            if loc_req not in a_loc and a_loc not in loc_req:
                continue

        # Ward filter
        if ward_id:
            w_req = str(ward_id).lower().strip()
            a_ward = str(a.get("matched_ward_id", "")).lower()
            if a_ward != w_req:
                continue

        # Location scope filter
        if location_scope:
            s_req = str(location_scope).upper().strip()
            if str(a.get("location_scope", "")).upper() != s_req:
                continue

        filtered.append(a)

    return filtered[:limit]


def get_news_by_hazard(hazard_type: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Convenience function to fetch news filtered by a specific hazard."""
    return get_latest_news(limit=limit, hazard_type=hazard_type)


def get_news_by_locality(locality: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Convenience function to fetch news filtered by a specific locality name."""
    return get_latest_news(limit=limit, locality=locality)


def get_news_for_ward(ward_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Convenience function to fetch news matching a specific BMC ward ID."""
    return get_latest_news(limit=limit, ward_id=ward_id)


def get_citywide_news(limit: int = 20) -> List[Dict[str, Any]]:
    """Fetches all relevant Bhubaneswar disaster news articles."""
    return get_latest_news(limit=limit)


# ==============================================================================
# NEWS TICKER FEED
# ==============================================================================

def get_news_ticker_feed(limit: int = 10, sample_articles: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
    """
    Returns an optimized, lightweight news feed designed for frontend moving
    news ticker / marquee display.

    Returns:
        List of dicts: title, source_name, url, hazard_type, matched_locality, location_scope.
    """
    articles = get_latest_news(limit=limit, sample_articles=sample_articles)

    ticker_items = []
    for a in articles:
        ticker_items.append({
            "id": a.get("id"),
            "title": a.get("title"),
            "source_name": a.get("source_name"),
            "url": a.get("url"),
            "hazard_type": a.get("hazard_type"),
            "matched_locality": a.get("matched_locality") or "Bhubaneswar",
            "location_scope": a.get("location_scope", "CITYWIDE"),
            "published_at": a.get("published_at"),
            "action_text": "Read Original Article",
        })

    return ticker_items


# ==============================================================================
# MAP-ZONE INTEGRATION (ASSOCIATING NEWS WITH EXISTING HAZARD ZONES)
# ==============================================================================

def get_news_for_map_zone(
    ward_id: str,
    hazard_type: str,
    locality: Optional[str] = None,
    limit: int = 5,
    sample_articles: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """
    Finds news articles specifically matching an active map hazard zone.

    Strict Matching Rules:
    1. First Priority: Articles specifically matching BOTH the ward/locality AND the hazard.
    2. Second Priority: Articles matching the ward/locality generally.
    3. An article about Baramunda is NEVER returned for Kalinga Nagar.
    4. General citywide news is NOT falsely injected as locality-specific news unless explicitly requested.

    Returns:
        List of relevant news entities for the map zone.
    """
    articles = sample_articles if sample_articles is not None else get_cached_or_fresh_news()

    w_clean = str(ward_id).lower().strip()
    h_clean = str(hazard_type).lower().strip()
    loc_clean = str(locality).lower().strip() if locality else ""

    # Also resolve locality from ward_id if locality wasn't provided
    if not loc_clean:
        for k, v in LOCALITY_WARD_MAP.items():
            if v.get("ward_id") == w_clean:
                loc_clean = v.get("canonical", "").lower()
                break

    matched_exact = []
    compatible_hazards = HAZARD_COMPATIBILITY.get(h_clean, {h_clean})

    for a in articles:
        a_ward = str(a.get("matched_ward_id", "")).lower()
        a_loc = str(a.get("matched_locality", "")).lower()
        a_hazard = str(a.get("hazard_type", "")).lower()

        # Check locality / ward match
        is_locality_match = (
            (a_ward and a_ward == w_clean)
            or (loc_clean and (loc_clean in a_loc or a_loc in loc_clean))
        )

        if is_locality_match:
            # Check hazard compatibility
            if a_hazard in compatible_hazards or a_hazard == h_clean:
                matched_exact.append(a)

    return matched_exact[:limit]


def get_zone_details_with_news(
    ward_id: str,
    hazard_type: Optional[str] = None,
    precomputed_results: Optional[List[Dict[str, Any]]] = None,
    sample_articles: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Retrieves complete zone details from map_zones.py combined with associated
    relevant news articles for the [View More Details] popup.

    CRITICAL GUARANTEE:
    Attaching news does NOT modify risk_score, severity, confidence, or affected_radius_km.
    """
    # 1. Fetch official analytical zone details from map_zones.py
    details = map_zones.get_zone_details(
        ward_id=ward_id,
        hazard_type=hazard_type,
        precomputed_results=precomputed_results,
    )

    if "error" in details:
        return details

    primary_hazard = details.get("primary_hazard", hazard_type or "heavy_rainfall")
    ward_name = details.get("ward_name", "")

    # 2. Discover matching news for this specific zone
    related_news = get_news_for_map_zone(
        ward_id=ward_id,
        hazard_type=primary_hazard,
        locality=ward_name,
        sample_articles=sample_articles,
    )

    # 3. Format related news payload with original article links
    news_payload = []
    for n in related_news:
        news_payload.append({
            "id": n.get("id"),
            "title": n.get("title"),
            "short_overview": n.get("description"),
            "source_name": n.get("source_name"),
            "url": n.get("url"),
            "image_url": n.get("image_url"),
            "published_at": n.get("published_at"),
            "matched_locality": n.get("matched_locality"),
            "relevance_score": n.get("relevance_score"),
            "action_button": "READ ORIGINAL ARTICLE",
        })

    # Attach related news without touching risk numbers
    details["related_news"] = news_payload
    details["has_related_news"] = len(news_payload) > 0

    return details
