/**
 * NivaranAI - Offline Cache Service
 * 
 * Provides robust, exception-safe caching of telemetry, hazard zones, and reports
 * in browser localStorage with expiration / staleness tracking.
 */

export const CACHE_PREFIX = 'nivaran_cache_';
export const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface CachedItem<T> {
  data: T;
  timestamp: number;
}

/**
 * Generates the prefixed localStorage key.
 */
function getStorageKey(key: string): string {
  return `${CACHE_PREFIX}${key}`;
}

/**
 * Save serializable data with a timestamp to localStorage.
 * Wrapped in try/catch to safely handle storage quota errors or disabled storage.
 */
export function saveCache<T>(key: string, data: T): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const payload: CachedItem<T> = {
      data,
      timestamp: Date.now()
    };

    localStorage.setItem(getStorageKey(key), JSON.stringify(payload));
  } catch (err) {
    // Safe fallback for quota limit exceeded or disabled storage in private browsing
    console.warn(`[offlineCache] Failed to save cache for key "${key}":`, err);
  }
}

/**
 * Read and parse cached data from localStorage.
 * Returns null if missing, corrupted, or if storage access is blocked.
 */
export function loadCache<T>(key: string): { data: T; timestamp: number } | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    const raw = localStorage.getItem(getStorageKey(key));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CachedItem<T>;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.timestamp !== 'number' || !('data' in parsed)) {
      return null;
    }

    return {
      data: parsed.data,
      timestamp: parsed.timestamp
    };
  } catch (err) {
    console.warn(`[offlineCache] Failed to load cache for key "${key}":`, err);
    return null;
  }
}

/**
 * Determines whether a cached item's timestamp is older than the given threshold.
 * Defaults to 30 minutes.
 */
export function isStale(timestamp: number, thresholdMs: number = DEFAULT_CACHE_TTL_MS): boolean {
  if (typeof timestamp !== 'number' || isNaN(timestamp)) {
    return true;
  }
  return Date.now() - timestamp > thresholdMs;
}

/**
 * Removes a cached item by key from localStorage.
 * Wrapped in try/catch for safety.
 */
export function clearCache(key: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    localStorage.removeItem(getStorageKey(key));
  } catch (err) {
    console.warn(`[offlineCache] Failed to clear cache for key "${key}":`, err);
  }
}
