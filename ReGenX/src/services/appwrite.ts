/**
 * Appwrite Backend Configuration & SDK Integration Bridge
 * 
 * Defines the collections schema and Appwrite client endpoints 
 * consumed by the Python backend and NivaranAI frontend.
 */

export const APPWRITE_CONFIG = {
  ENDPOINT: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  PROJECT_ID: import.meta.env.VITE_APPWRITE_PROJECT_ID || 'nivaran-ai-disaster-mgmt',
  DATABASE_ID: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'disaster_main_db',
  COLLECTIONS: {
    RISK_ZONES: 'risk_zones',
    EMERGENCY_LOCATIONS: 'emergency_locations',
    CROWD_UPDATES: 'crowd_updates',
    OFFICIAL_UPDATES: 'official_updates',
    DISASTER_NEWS: 'disaster_news',
    USER_PROFILES: 'user_profiles',
    AUDIT_LOGS: 'audit_logs',
    SCHEDULER_RUNS: 'scheduler_runs'
  }
};

/**
 * FCM & Twilio Integration Config
 */
export const NOTIFICATION_CONFIG = {
  FCM_VAPID_KEY: import.meta.env.VITE_FCM_VAPID_KEY || 'BCuzmpc1Xi3xmnc6fM2LZMTvmt1roRVz7vatvBjAm1Gww1XyLAJctszdIf5LboVUhqL_QiZxx7ffblXTezOmXqE',
  TWILIO_STATUS: 'OPERATIONAL'
};
