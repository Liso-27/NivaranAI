/**
 * NivaranAI Cookie Preferences Storage Service
 *
 * Lightweight browser storage preference manager for essential & functional local data.
 * Note: NivaranAI does NOT collect or share data with third-party tracking or advertising networks.
 */

export interface CookiePreferences {
  necessary: boolean; // Session token, auth state, CSRF (Always true)
  functional: boolean; // Theme preferences, cached location, UI state
  analytics: boolean; // Set to false by default as no third-party tracking is present
  updatedAt?: string;
}

const COOKIE_PREF_KEY = 'nivaran_cookie_preferences';

export const DEFAULT_COOKIE_PREFERENCES: CookiePreferences = {
  necessary: true,
  functional: true,
  analytics: false
};

export function getCookiePreferences(): CookiePreferences {
  try {
    const saved = localStorage.getItem(COOKIE_PREF_KEY);
    if (!saved) return DEFAULT_COOKIE_PREFERENCES;
    const parsed = JSON.parse(saved);
    return {
      necessary: true,
      functional: Boolean(parsed.functional),
      analytics: Boolean(parsed.analytics),
      updatedAt: parsed.updatedAt
    };
  } catch {
    return DEFAULT_COOKIE_PREFERENCES;
  }
}

export function saveCookiePreferences(prefs: Partial<CookiePreferences>): CookiePreferences {
  const current = getCookiePreferences();
  const updated: CookiePreferences = {
    necessary: true,
    functional: prefs.functional !== undefined ? Boolean(prefs.functional) : current.functional,
    analytics: false, // NivaranAI does not use third-party analytics
    updatedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(COOKIE_PREF_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save cookie preferences to localStorage:', err);
  }

  return updated;
}

export function acceptAllCookies(): CookiePreferences {
  return saveCookiePreferences({ functional: true });
}
