import { Language } from './languages';
import { getCurrentLanguage } from './translate';
import { PHRASES } from './translations/phrases';
import { WARD_NAMES } from './translations/wards';
import { tHazard, tSeverity } from './domain';

export function translateWardPhrase(wardStr: string, lang: Language): string {
  if (!wardStr || typeof wardStr !== 'string' || !wardStr.trim()) return '';
  const trimmed = wardStr.trim();

  // Pattern: "Ward <id>" or "Ward-<id>"
  const wardMatch = trimmed.match(/^Ward[\s-]+(\d+)$/i);
  if (wardMatch) {
    const id = parseInt(wardMatch[1], 10);
    if (WARD_NAMES[id]) {
      return WARD_NAMES[id][lang] || WARD_NAMES[id].en;
    }
    if (lang === 'hi') return `वार्ड ${id}`;
    if (lang === 'or') return `ୱାର୍ଡ ${id}`;
    return `Ward ${id}`;
  }

  // Exact match in WARD_NAMES by english name
  const lower = trimmed.toLowerCase();
  for (const entry of Object.values(WARD_NAMES)) {
    if (entry.en.toLowerCase() === lower) {
      return entry[lang] || entry.en;
    }
  }

  // Partial match in slash-separated names (e.g. "Nayapalli" in "Nayapalli / Nuasahi")
  for (const entry of Object.values(WARD_NAMES)) {
    const enParts = entry.en.split('/').map(p => p.trim().toLowerCase());
    const matchIdx = enParts.findIndex(p => p === lower || lower.includes(p));
    if (matchIdx !== -1) {
      const targetParts = (entry[lang] || entry.en).split('/').map(p => p.trim());
      if (targetParts[matchIdx]) {
        return targetParts[matchIdx];
      }
      return entry[lang] || entry.en;
    }
  }

  // Check PHRASES table (e.g. "Kalinga Nagar K-4 to K-7", "Bomikhal Gangua Canal", etc.)
  if (PHRASES[trimmed]) {
    if (lang === 'en') return trimmed;
    return PHRASES[trimmed][lang] || trimmed;
  }

  return trimmed;
}

export function tx(text: string | null | undefined, lang?: Language): string {
  // (a) Return input unchanged for empty / non-string input
  if (!text || typeof text !== 'string') {
    return (text as any) ?? '';
  }

  try {
    const targetLang = lang ?? getCurrentLanguage();

    // (b) Exact match in phrases.ts
    if (PHRASES[text]) {
      if (targetLang === 'en') return text;
      return PHRASES[text][targetLang] || text;
    }
    const trimmed = text.trim();
    if (PHRASES[trimmed]) {
      if (targetLang === 'en') return text;
      return PHRASES[trimmed][targetLang] || text;
    }

    // Direct ward name lookup
    const lower = trimmed.toLowerCase();
    for (const entry of Object.values(WARD_NAMES)) {
      if (entry.en.toLowerCase() === lower) {
        if (targetLang === 'en') return text;
        return entry[targetLang] || text;
      }
    }

    // (c) Pattern translators for fixed templates:

    // 1. map_zones.py sentence:
    // "<Hazard> risk is <SEVERITY> in <ward> (Score: X/100, Confidence: Y%)."
    const MAP_ZONE_REGEX = /^([\w\s]+?)\s+risk\s+is\s+(LOW|MODERATE|HIGH|EMERGENCY)\s+in\s+([^(]+?)\s*\((?:Score:\s*|score\s+)([\d.]+)\/100,\s*(?:Confidence:\s*|confidence\s+)?([\d.]+)%?\s*(?:confidence)?\)\.?$/i;
    const mapMatch = trimmed.match(MAP_ZONE_REGEX);
    if (mapMatch) {
      const [, rawHazard, rawSev, rawWard, score, confidence] = mapMatch;
      const h = tHazard(rawHazard.trim(), targetLang);
      const s = tSeverity(rawSev.trim(), targetLang);
      const w = translateWardPhrase(rawWard.trim(), targetLang);

      if (targetLang === 'hi') {
        return `${w} में ${h} का जोखिम ${s} है (स्कोर: ${score}/100, विश्वसनीयता: ${confidence}%)।`;
      }
      if (targetLang === 'or') {
        return `${w} ରେ ${h} ବିପଦ ${s} ସ୍ତରରେ ଅଛି (ସ୍କୋର: ${score}/100, ବିଶ୍ୱସନୀୟତା: ${confidence}%)।`;
      }
      return `${h} risk is ${s} in ${w} (Score: ${score}/100, Confidence: ${confidence}%).`;
    }

    // 2. Notification title:
    // "<SEVERITY>: <HAZARD> in <ward>"
    const NOTIF_TITLE_REGEX = /^(LOW|MODERATE|HIGH|EMERGENCY):\s+([^:]+?)\s+in\s+(.+)$/i;
    const notifMatch = trimmed.match(NOTIF_TITLE_REGEX);
    if (notifMatch) {
      const [, rawSev, rawHazard, rawWard] = notifMatch;
      const s = tSeverity(rawSev.trim(), targetLang);
      const h = tHazard(rawHazard.trim(), targetLang);
      const w = translateWardPhrase(rawWard.trim(), targetLang);

      if (targetLang === 'hi') {
        return `${s}: ${w} में ${h}`;
      }
      if (targetLang === 'or') {
        return `${s}: ${w} ରେ ${h}`;
      }
      return `${s}: ${h} in ${w}`;
    }

    // 3. In-app notification alert:
    // "NivaranAI [<SEVERITY>]: <ward>"
    const ALERT_REGEX = /^NivaranAI\s*\[(LOW|MODERATE|HIGH|EMERGENCY)\]:\s*(.+)$/i;
    const alertMatch = trimmed.match(ALERT_REGEX);
    if (alertMatch) {
      const [, rawSev, rawWard] = alertMatch;
      const s = tSeverity(rawSev.trim(), targetLang);
      const w = translateWardPhrase(rawWard.trim(), targetLang);
      return `NivaranAI [${s}]: ${w}`;
    }

    // 4. API fallback short description:
    // "<Hazard> risk is <SEVERITY> in Ward <wardNum>."
    const API_DESC_REGEX = /^([\w\s]+?)\s+risk\s+is\s+(LOW|MODERATE|HIGH|EMERGENCY)\s+in\s+Ward\s+(\d+)\.?$/i;
    const apiMatch = trimmed.match(API_DESC_REGEX);
    if (apiMatch) {
      const [, rawHazard, rawSev, wardNum] = apiMatch;
      const h = tHazard(rawHazard.trim(), targetLang);
      const s = tSeverity(rawSev.trim(), targetLang);
      const id = parseInt(wardNum, 10);
      const w = WARD_NAMES[id] ? (WARD_NAMES[id][targetLang] || WARD_NAMES[id].en) : (targetLang === 'hi' ? `वार्ड ${id}` : targetLang === 'or' ? `ୱାର୍ଡ ${id}` : `Ward ${id}`);

      if (targetLang === 'hi') {
        return `${w} में ${h} का जोखिम ${s} है।`;
      }
      if (targetLang === 'or') {
        return `${w} ରେ ${h} ବିପଦ ${s} ସ୍ତରରେ ଅଛି।`;
      }
      return `${h} risk is ${s} in Ward ${id}.`;
    }

    // (d) Otherwise return the original text UNCHANGED
    return text;
  } catch {
    // It must never throw
    return text;
  }
}
