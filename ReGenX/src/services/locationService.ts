/**
 * NivaranAI - Frontend Geolocation Service
 * 
 * Provides robust browser/device location acquisition, permission inspection,
 * error state classification, and watch subscriptions via the HTML5 Geolocation API.
 * 
 * IMPORTANT: Strictly handles location coordinates and states.
 * Does NOT perform derived disaster risk calculations.
 */

import { GeolocationPermissionState } from '../types';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

export interface LocationResult {
  success: boolean;
  location?: LocationData;
  permissionStatus: GeolocationPermissionState;
  error?: string;
}

export interface GeolocationServiceOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

const DEFAULT_OPTIONS: GeolocationServiceOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 30000
};

/**
 * Check if the browser supports HTML5 Geolocation API.
 */
export function isGeolocationSupported(): boolean {
  return typeof window !== 'undefined' && 'navigator' in window && 'geolocation' in navigator;
}

/**
 * Query browser Permission API for geolocation status if supported.
 */
export async function getGeolocationPermissionStatus(): Promise<GeolocationPermissionState> {
  if (!isGeolocationSupported()) {
    return 'unavailable';
  }

  if (typeof navigator.permissions !== 'undefined' && typeof navigator.permissions.query === 'function') {
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      if (status.state === 'granted') return 'granted';
      if (status.state === 'denied') return 'denied';
      return 'prompt';
    } catch (e) {
      // Permission query not supported on all browser engines (e.g. iOS Safari)
      return 'idle';
    }
  }

  return 'idle';
}

/**
 * Acquire the user's current GPS / device coordinates.
 * Returns a clean LocationResult without throwing unhandled exceptions.
 */
export function getCurrentLocation(
  options: GeolocationServiceOptions = DEFAULT_OPTIONS
): Promise<LocationResult> {
  return new Promise((resolve) => {
    if (!isGeolocationSupported()) {
      resolve({
        success: false,
        permissionStatus: 'unavailable',
        error: 'Geolocation is not supported by your browser.'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
          timestamp: position.timestamp || Date.now()
        };

        // Cache last known location in sessionStorage for instant retrieval
        try {
          sessionStorage.setItem('nivaran_last_location', JSON.stringify(location));
        } catch (e) {
          // Ignore storage quota errors
        }

        resolve({
          success: true,
          location,
          permissionStatus: 'granted'
        });
      },
      (error: GeolocationPositionError) => {
        let status: GeolocationPermissionState = 'error';
        let message = 'Unable to determine your current location.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            status = 'denied';
            message = 'Location permission was denied. Please allow location access in your browser settings to pinpoint your area.';
            break;
          case error.POSITION_UNAVAILABLE:
            status = 'unavailable';
            message = 'GPS or network location information is currently unavailable. Please verify your device location settings.';
            break;
          case error.TIMEOUT:
            status = 'timeout';
            message = 'Location request timed out. Please retry with a stronger GPS/network signal.';
            break;
          default:
            status = 'error';
            message = error.message || 'An unexpected error occurred while fetching device location.';
            break;
        }

        console.warn(`[Location Service] Geolocation error (${error.code}):`, message);

        resolve({
          success: false,
          permissionStatus: status,
          error: message
        });
      },
      {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 10000,
        maximumAge: options.maximumAge ?? 30000
      }
    );
  });
}

/**
 * Subscribe to continuous position changes.
 * Returns an unsubscribe callback function to cancel the watcher.
 */
export function watchUserPosition(
  onSuccess: (location: LocationData) => void,
  onError?: (error: LocationResult) => void,
  options: GeolocationServiceOptions = DEFAULT_OPTIONS
): () => void {
  if (!isGeolocationSupported()) {
    if (onError) {
      onError({
        success: false,
        permissionStatus: 'unavailable',
        error: 'Geolocation is not supported by your browser.'
      });
    }
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (position: GeolocationPosition) => {
      const location: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
        timestamp: position.timestamp || Date.now()
      };
      onSuccess(location);
    },
    (error: GeolocationPositionError) => {
      let status: GeolocationPermissionState = 'error';
      let message = 'Unable to update location.';

      if (error.code === error.PERMISSION_DENIED) {
        status = 'denied';
        message = 'Location permission was denied.';
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        status = 'unavailable';
        message = 'Position unavailable.';
      } else if (error.code === error.TIMEOUT) {
        status = 'timeout';
        message = 'Location update timed out.';
      }

      if (onError) {
        onError({
          success: false,
          permissionStatus: status,
          error: message
        });
      }
    },
    {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 15000,
      maximumAge: options.maximumAge ?? 10000
    }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}

/**
 * Retrieve cached location from session storage if available.
 */
export function getCachedLocation(): LocationData | null {
  try {
    const saved = sessionStorage.getItem('nivaran_last_location');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

/**
 * Helper to format coordinates for display.
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
}

/**
 * Clean structure ready for future backend dispatch.
 * (Does not call any hardcoded backend endpoints).
 */
export async function syncLocationWithBackend(
  location: LocationData,
  userId?: string
): Promise<{ success: boolean; message?: string }> {
  console.log(`[Location Service] Location ready for backend sync (User: ${userId || 'anonymous'}):`, location);
  return { success: true, message: 'Location data prepared for backend dispatch.' };
}
