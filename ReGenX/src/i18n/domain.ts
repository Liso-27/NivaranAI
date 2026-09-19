import { Language } from './languages';
import { getCurrentLanguage, translate } from './translate';
import { TranslationKey } from './translations/en';
import { WARD_NAMES } from './translations/wards';
import { tx } from './dynamicText';

export function prettify(value: string | undefined | null): string {
  if (!value) return '';
  const cleaned = String(value).replace(/[_-]+/g, ' ').trim();
  return cleaned
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function tHazard(hazard: string, lang?: Language): string {
  if (!hazard || typeof hazard !== 'string' || !hazard.trim()) return 'Hazard';
  const targetLang = lang ?? getCurrentLanguage();
  const normalized = hazard.trim().toLowerCase().replace(/[\s-]+/g, '_');

  const hazardMap: Record<string, string> = {
    heavy_rain: 'heavy_rainfall',
    rain: 'heavy_rainfall',
    rainfall: 'heavy_rainfall',
    flood: 'flood',
    flooding: 'flood',
    waterlogging: 'waterlogging',
    water_logging: 'waterlogging',
    cyclone: 'cyclone',
    storm: 'cyclone',
    lightning: 'lightning',
    thunderstorm: 'lightning',
  };

  const mappedKey = hazardMap[normalized] || normalized;
  const key = `hazard.${mappedKey}` as TranslationKey;
  const translated = translate(key, undefined, targetLang);
  if (translated !== key) return translated;

  return prettify(hazard);
}

export function tSeverity(severity: string, lang?: Language): string {
  if (!severity || typeof severity !== 'string' || !severity.trim()) return 'Normal';
  const targetLang = lang ?? getCurrentLanguage();
  const normalized = severity.trim().toUpperCase().replace(/[\s-]+/g, '_');

  const key = `severity.${normalized}` as TranslationKey;
  const translated = translate(key, undefined, targetLang);
  if (translated !== key) return translated;

  return prettify(severity);
}

export function tSafePlaceType(type: string, lang?: Language): string {
  if (!type || typeof type !== 'string' || !type.trim()) return 'Safe Place';
  const targetLang = lang ?? getCurrentLanguage();
  const normalized = type.trim().toLowerCase().replace(/[\s-]+/g, '_');

  const typeMap: Record<string, string> = {
    hospital: 'hospital',
    police_station: 'police_station',
    police: 'police_station',
    fire_station: 'fire_station',
    fire: 'fire_station',
    official_shelter: 'official_shelter',
    relief_centre: 'relief_centre',
    relief_center: 'relief_centre',
    government_camp: 'government_camp',
    temporary_camp: 'temporary_camp',
    shelter: 'shelter',
    community_center: 'community_center',
    community_centre: 'community_center',
    school: 'school',
    other: 'other',
  };

  const mappedKey = typeMap[normalized] || normalized;
  const key = `safePlace.type.${mappedKey}` as TranslationKey;
  const translated = translate(key, undefined, targetLang);
  if (translated !== key) return translated;

  return prettify(type);
}

export function tSafePlaceStatus(status: string, lang?: Language): string {
  if (!status || typeof status !== 'string' || !status.trim()) return 'Open';
  const targetLang = lang ?? getCurrentLanguage();
  const normalized = status.trim().toUpperCase().replace(/[\s-]+/g, '_');

  const key = `safePlace.status.${normalized}` as TranslationKey;
  const translated = translate(key, undefined, targetLang);
  if (translated !== key) return translated;

  return prettify(status);
}

export function tRole(role: string, lang?: Language): string {
  if (!role || typeof role !== 'string' || !role.trim()) return 'Citizen';
  const targetLang = lang ?? getCurrentLanguage();
  const normalized = role.trim().toUpperCase().replace(/[\s-]+/g, '_');

  const key = `role.${normalized}` as TranslationKey;
  const translated = translate(key, undefined, targetLang);
  if (translated !== key) return translated;

  return prettify(role);
}

export function tOfficialStatus(status: string, lang?: Language): string {
  if (!status || typeof status !== 'string' || !status.trim()) return 'Pending';
  const targetLang = lang ?? getCurrentLanguage();
  const normalized = status.trim().toUpperCase().replace(/[\s-]+/g, '_');

  const approvalKey = `approval.${normalized}` as TranslationKey;
  const appTrans = translate(approvalKey, undefined, targetLang);
  if (appTrans !== approvalKey) return appTrans;

  const mitKey = `mitigation.${normalized}` as TranslationKey;
  const mitTrans = translate(mitKey, undefined, targetLang);
  if (mitTrans !== mitKey) return mitTrans;

  const verKey = `verification.${normalized}` as TranslationKey;
  const verTrans = translate(verKey, undefined, targetLang);
  if (verTrans !== verKey) return verTrans;

  return prettify(status);
}

export function tObservationType(type: string, lang?: Language): string {
  if (!type || typeof type !== 'string' || !type.trim()) return 'Observation';
  const targetLang = lang ?? getCurrentLanguage();
  const normalized = type.trim().toLowerCase().replace(/[\s-]+/g, '_');

  const obsMap: Record<string, string> = {
    flooding: 'flooding',
    flood: 'flooding',
    waterlogging: 'waterlogging',
    heavy_rain: 'heavy_rain',
    heavy_rainfall: 'heavy_rain',
    lightning: 'lightning',
    power_outage: 'power_outage',
    road_damage: 'road_damage',
    road_blocked: 'road_blocked',
    structural_damage: 'structural_damage',
    fallen_tree: 'fallen_tree',
    other: 'other',
  };

  const mapped = obsMap[normalized] || normalized;
  const key = `observation.${mapped}` as TranslationKey;
  const translated = translate(key, undefined, targetLang);
  if (translated !== key) return translated;

  const hazardKey = `hazard.${mapped}` as TranslationKey;
  const hazardTrans = translate(hazardKey, undefined, targetLang);
  if (hazardTrans !== hazardKey) return hazardTrans;

  return prettify(type);
}

export function tMitigationStatus(status: string, lang?: Language): string {
  if (!status || typeof status !== 'string' || !status.trim()) return 'Confirmed';
  const targetLang = lang ?? getCurrentLanguage();
  const normalized = status.trim().toUpperCase().replace(/[\s-]+/g, '_');

  const key = `mitigation.${normalized}` as TranslationKey;
  const translated = translate(key, undefined, targetLang);
  if (translated !== key) return translated;

  return prettify(status);
}

export function tVerification(state: string, lang?: Language): string {
  if (!state || typeof state !== 'string' || !state.trim()) return 'Unverified';
  const targetLang = lang ?? getCurrentLanguage();
  const normalized = state.trim().toUpperCase().replace(/[\s-]+/g, '_');

  const key = `verification.${normalized}` as TranslationKey;
  const translated = translate(key, undefined, targetLang);
  if (translated !== key) return translated;

  return prettify(state);
}

export function tZone(zone: string, lang?: Language): string {
  if (!zone || typeof zone !== 'string' || !zone.trim()) return 'Zone';
  const targetLang = lang ?? getCurrentLanguage();
  let normalized = zone.trim();
  normalized = normalized.replace(/\s*zone$/i, '').trim();

  if (/^south[\s_-]*west$/i.test(normalized)) {
    normalized = 'South-West';
  } else if (/^south[\s_-]*east$/i.test(normalized)) {
    normalized = 'South-East';
  } else if (/^north$/i.test(normalized)) {
    normalized = 'North';
  }

  const key = `zone.${normalized}` as TranslationKey;
  const translated = translate(key, undefined, targetLang);
  if (translated !== key) return translated;

  return prettify(zone);
}

export function tWard(
  wardId?: number | string | null,
  fallbackName?: string | null,
  lang?: Language
): string {
  const targetLang = lang ?? getCurrentLanguage();

  let numericId: number | undefined;
  if (typeof wardId === 'number' && !isNaN(wardId) && wardId > 0) {
    numericId = wardId;
  } else if (typeof wardId === 'string' && wardId.trim().length > 0) {
    const digits = wardId.replace(/\D/g, '');
    if (digits) {
      const parsed = parseInt(digits, 10);
      if (!isNaN(parsed) && parsed > 0) {
        numericId = parsed;
      }
    }
  }

  const canonicalEntry = numericId ? WARD_NAMES[numericId] : undefined;

  if (canonicalEntry) {
    if (fallbackName && fallbackName.trim()) {
      const cleanFallback = fallbackName.trim().toLowerCase();
      const cleanCanonical = canonicalEntry.en.trim().toLowerCase();

      const isCanonicalMatch =
        cleanFallback === cleanCanonical ||
        cleanFallback === `ward ${numericId}` ||
        cleanFallback === `ward-${numericId}` ||
        cleanFallback === `ward ${String(numericId).padStart(2, '0')}`;

      if (!isCanonicalMatch) {
        return tx(fallbackName, targetLang);
      }
    }
    return canonicalEntry[targetLang] || canonicalEntry.en;
  }

  if (fallbackName && fallbackName.trim()) {
    return tx(fallbackName, targetLang);
  }

  if (wardId !== undefined && wardId !== null && String(wardId).trim() !== '') {
    const idStr = String(wardId).trim();
    if (targetLang === 'hi') return `वार्ड ${idStr}`;
    if (targetLang === 'or') return `ୱାର୍ଡ ${idStr}`;
    return `Ward ${idStr}`;
  }

  return 'Bhubaneswar';
}
