/**
 * NivaranAI - Firebase Cloud Messaging (FCM) Web Push Service
 * 
 * Provides robust token acquisition, foreground message handling,
 * Service Worker registration, and structured lifecycle states.
 */

import { getMessaging, getToken, onMessage, isSupported, Messaging, MessagePayload } from 'firebase/messaging';
import { app } from './firebase';

/**
 * Public VAPID Key specifically configured for Web Push token generation.
 * (This is a public web push encryption key, not a private credential).
 */
export const FCM_VAPID_PUBLIC_KEY = 
  import.meta.env.VITE_FCM_VAPID_KEY || 
  'BCuzmpc1Xi3xmnc6fM2LZMTvmt1roRVz7vatvBjAm1Gww1XyLAJctszdIf5LboVUhqL_QiZxx7ffblXTezOmXqE';

export interface FCMTokenResult {
  success: boolean;
  token: string | null;
  permission: NotificationPermission;
  error?: string;
}

export type FCMForegroundHandler = (payload: MessagePayload) => void;

let messagingInstance: Messaging | null = null;
let swRegistrationInstance: ServiceWorkerRegistration | null = null;

/**
 * Check if the current browser environment supports Firebase Cloud Messaging.
 */
export async function isFCMSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('Notification' in window) || !('PushManager' in window)) {
    return false;
  }
  try {
    return await isSupported();
  } catch (err) {
    console.warn('[FCM Service] Browser environment compatibility check failed:', err);
    return false;
  }
}

/**
 * Lazily retrieve or initialize the Firebase Messaging singleton instance.
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (messagingInstance) return messagingInstance;

  const supported = await isFCMSupported();
  if (!supported) {
    console.warn('[FCM Service] Firebase Cloud Messaging is not supported in this browser environment.');
    return null;
  }

  try {
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (err) {
    console.error('[FCM Service] Failed to initialize Firebase Messaging instance:', err);
    return null;
  }
}

/**
 * Register or reuse the dedicated Firebase Messaging Service Worker.
 */
export async function registerFCMServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  if (swRegistrationInstance) {
    return swRegistrationInstance;
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });

    // Wait for the Service Worker to become active/ready
    await navigator.serviceWorker.ready;
    swRegistrationInstance = registration;
    console.log('[FCM Service] Service Worker registered successfully with scope:', registration.scope);
    return registration;
  } catch (err) {
    console.error('[FCM Service] Service Worker registration failed:', err);
    return null;
  }
}

/**
 * Requests browser notification permission and generates a REAL FCM Registration Token.
 * 
 * Handles:
 * - Permission default / prompt
 * - Permission denied (graceful fallback)
 * - Permission granted (initializes messaging, SW, and gets token)
 * - Network / Firebase errors without crashing
 */
export async function requestFCMToken(): Promise<FCMTokenResult> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return {
      success: false,
      token: null,
      permission: 'denied',
      error: 'Browser does not support notifications or is running in a non-browser context.'
    };
  }

  try {
    // 1. Check & Request Notification Permission
    let currentPermission: NotificationPermission = Notification.permission;

    if (currentPermission === 'default') {
      currentPermission = await Notification.requestPermission();
    }

    if (currentPermission !== 'granted') {
      console.info(`[FCM Service] Notification permission status is "${currentPermission}".`);
      return {
        success: false,
        token: null,
        permission: currentPermission,
        error: currentPermission === 'denied' 
          ? 'Notification permission was denied. Please enable notifications in your browser settings.'
          : 'Notification permission request was dismissed.'
      };
    }

    // 2. Initialize Messaging & Service Worker
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return {
        success: false,
        token: null,
        permission: currentPermission,
        error: 'Firebase Messaging could not be initialized in this browser.'
      };
    }

    const swRegistration = await registerFCMServiceWorker();
    if (!swRegistration) {
      return {
        success: false,
        token: null,
        permission: currentPermission,
        error: 'Service worker registration failed. Push notifications cannot be received.'
      };
    }

    // 3. Generate REAL FCM Registration Token using provided VAPID Key
    console.log('[FCM Service] Generating real FCM registration token with VAPID key...');
    const token = await getToken(messaging, {
      vapidKey: FCM_VAPID_PUBLIC_KEY,
      serviceWorkerRegistration: swRegistration
    });

    if (token) {
      console.log('[FCM Service] Real FCM Registration Token acquired:', token);
      
      // Keep token in session / local storage for fast retrieval
      try {
        localStorage.setItem('nivaran_fcm_token', token);
      } catch (e) {
        // Ignore storage quotas
      }

      return {
        success: true,
        token,
        permission: 'granted'
      };
    } else {
      return {
        success: false,
        token: null,
        permission: 'granted',
        error: 'No FCM registration token returned from Firebase.'
      };
    }
  } catch (err: any) {
    console.error('[FCM Service] Error during FCM token acquisition:', err);

    let errorMessage = 'Failed to generate FCM push token.';
    if (err?.code === 'messaging/permission-blocked' || err?.message?.includes('permission')) {
      errorMessage = 'Push notification permission is blocked in browser settings.';
    } else if (err?.code === 'messaging/unsupported-browser') {
      errorMessage = 'This browser does not support Web Push notifications.';
    } else if (err?.code === 'messaging/failed-service-worker-registration') {
      errorMessage = 'Failed to register the Firebase messaging service worker.';
    } else if (err?.message) {
      errorMessage = err.message;
    }

    return {
      success: false,
      token: null,
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'denied',
      error: errorMessage
    };
  }
}

/**
 * Get previously cached FCM Token from storage if valid
 */
export function getCachedFCMToken(): string | null {
  try {
    return localStorage.getItem('nivaran_fcm_token');
  } catch {
    return null;
  }
}

/**
 * Clear cached FCM Token (e.g. on user logout / reset)
 */
export function clearCachedFCMToken(): void {
  try {
    localStorage.removeItem('nivaran_fcm_token');
  } catch {
    // Ignore
  }
}

/**
 * Subscribe to Foreground FCM Push Messages.
 * 
 * When the app is open and in focus, Firebase onMessage fires this handler.
 */
export async function subscribeToForegroundMessages(
  callback: FCMForegroundHandler
): Promise<(() => void) | null> {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('[FCM Service] Foreground Push Message received:', payload);
      callback(payload);
    });

    return unsubscribe;
  } catch (err) {
    console.warn('[FCM Service] Could not attach foreground message listener:', err);
    return null;
  }
}

/**
 * Future backend token registration hook.
 * Backend team can hook their API endpoint here when ready.
 */
export async function syncTokenWithBackend(
  fcmToken: string,
  userId?: string
): Promise<{ success: boolean; message?: string }> {
  // Ready for future backend endpoint integration (e.g. POST /api/v1/notifications/register-token)
  console.log(`[FCM Service] Token ready for backend sync (User: ${userId || 'anonymous'}):`, fcmToken);
  return { success: true, message: 'FCM Token registered locally and ready for backend dispatch.' };
}
