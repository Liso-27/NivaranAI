import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';

/**
 * Firebase Web Configuration for Project: apada-sathi-271b0
 */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let googleProviderInstance: GoogleAuthProvider | null = null;
let firebaseInitialized = false;

function initFirebaseSafely(): {
  app: FirebaseApp | null;
  auth: Auth | null;
  googleProvider: GoogleAuthProvider | null;
  isAvailable: boolean;
} {
  try {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

    const isPlaceholder = (val?: string) =>
      !val ||
      typeof val !== 'string' ||
      val.trim() === '' ||
      val.includes('PASTE_YOUR') ||
      val.includes('YOUR_FIREBASE') ||
      val === 'undefined';

    if (isPlaceholder(apiKey) || isPlaceholder(projectId)) {
      console.warn(
        '[Firebase Init] Configuration is missing or contains placeholder values. Firebase features will operate in safe fallback mode.'
      );
      return { app: null, auth: null, googleProvider: null, isAvailable: false };
    }

    if (getApps().length > 0) {
      appInstance = getApp();
    } else {
      appInstance = initializeApp(firebaseConfig);
    }

    authInstance = getAuth(appInstance);
    googleProviderInstance = new GoogleAuthProvider();
    googleProviderInstance.setCustomParameters({
      prompt: 'select_account',
    });

    firebaseInitialized = true;
  } catch (err) {
    console.error('[Firebase Init Error] Non-fatal failure initializing Firebase SDK:', err);
    appInstance = null;
    authInstance = null;
    googleProviderInstance = null;
    firebaseInitialized = false;
  }

  return {
    app: appInstance,
    auth: authInstance,
    googleProvider: googleProviderInstance,
    isAvailable: firebaseInitialized,
  };
}

const initialized = initFirebaseSafely();

export const app = initialized.app;
export const auth = initialized.auth;
export const googleProvider = initialized.googleProvider;
export const isFirebaseAvailable = initialized.isAvailable;

