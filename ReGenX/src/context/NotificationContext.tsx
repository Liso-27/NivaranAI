import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { InAppNotification, HazardZone, SeverityLevel } from '../types';
import { 
  requestFCMToken, 
  subscribeToForegroundMessages, 
  getCachedFCMToken 
} from '../services/fcmService';
import { disasterApi } from '../services/api';

interface NotificationContextType {
  notifications: InAppNotification[];
  unreadCount: number;
  fcmToken: string | null;
  fcmLoading: boolean;
  fcmError: string | null;
  permissionStatus: NotificationPermission;
  isPushEnabled: boolean;
  soundEnabled: boolean;
  requestNotificationPermission: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  toggleSound: () => void;
  triggerHazardAlert: (zone: HazardZone) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([
    {
      id: 'notif-01',
      title: 'EMERGENCY: Flood Inundation Warning',
      message: 'Flash flooding reported in Kalinga Nagar (Ward 59). Immediate evacuation to SUM Ultimate Relief Camp advised.',
      hazard_type: 'flood',
      severity: 'EMERGENCY',
      ward_name: 'Kalinga Nagar K-4 to K-7',
      ward_id: 59,
      timestamp: '2026-08-19T06:45:00Z',
      read: false,
      channel: 'FCM_PUSH'
    },
    {
      id: 'notif-02',
      title: 'HIGH: Severe Waterlogging Alert',
      message: 'Bomikhal Flyover underpass submerged (75cm water depth). Traffic diversions active.',
      hazard_type: 'waterlogging',
      severity: 'HIGH',
      ward_name: 'Bomikhal Gangua Canal',
      ward_id: 57,
      timestamp: '2026-08-19T06:30:00Z',
      read: false,
      channel: 'TWILIO_SMS'
    },
    {
      id: 'notif-03',
      title: 'MODERATE: Rain Advisory',
      message: 'Rasulgarh Industrial Area drainage congestion. Exercise caution while driving.',
      hazard_type: 'waterlogging',
      severity: 'MODERATE',
      ward_name: 'Rasulgarh Industrial Area',
      ward_id: 11,
      timestamp: '2026-08-19T06:00:00Z',
      read: true,
      channel: 'IN_APP'
    }
  ]);

  // Real FCM Registration Token tracking
  const [fcmToken, setFcmToken] = useState<string | null>(() => getCachedFCMToken());
  const [fcmLoading, setFcmLoading] = useState<boolean>(false);
  const [fcmError, setFcmError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isPushEnabled, setIsPushEnabled] = useState<boolean>(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Play audio alert tone for HIGH / EMERGENCY
  const playAlertTone = useCallback((severity: SeverityLevel) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = severity === 'EMERGENCY' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(severity === 'EMERGENCY' ? 880 : 587, audioCtx.currentTime); // A5 or D5
      
      if (severity === 'EMERGENCY') {
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.4);
      }
      
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio play restricted by browser policy');
    }
  }, [soundEnabled]);

  // Helper to sync FCM Token to backend without repeated unnecessary calls
  const syncFcmTokenToBackend = async (token: string) => {
    if (!token || typeof window === 'undefined') return;
    const lastSynced = sessionStorage.getItem('nivaran_fcm_synced');
    if (lastSynced === token) return;

    try {
      await disasterApi.registerDeviceToken({ fcm_token: token });
      sessionStorage.setItem('nivaran_fcm_synced', token);
      console.log('[FCM Context] Token registered with backend successfully.');
    } catch (err) {
      console.warn('[FCM Context] FCM token backend registration warning:', err);
    }
  };

  // Request browser permission and generate real FCM registration token
  const requestNotificationPermission = async () => {
    setFcmLoading(true);
    setFcmError(null);
    try {
      const result = await requestFCMToken();
      setPermissionStatus(result.permission);

      if (result.success && result.token) {
        setFcmToken(result.token);
        setIsPushEnabled(true);
        setFcmError(null);
        await syncFcmTokenToBackend(result.token);
      } else {
        if (result.permission === 'denied') {
          setIsPushEnabled(false);
          setFcmToken(null);
        }
        if (result.error) {
          setFcmError(result.error);
        }
      }
    } catch (e: any) {
      console.warn('Notification permission request error:', e);
      setFcmError(e?.message || 'Failed to initialize notification push service.');
    } finally {
      setFcmLoading(false);
    }
  };

  // If permission is already granted, refresh/sync the real FCM Token on startup
  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermissionStatus(Notification.permission);
      if (Notification.permission === 'granted') {
        setIsPushEnabled(true);
        // Silently obtain fresh FCM token in background
        requestFCMToken().then(result => {
          if (result.success && result.token) {
            setFcmToken(result.token);
            syncFcmTokenToBackend(result.token);
          }
        }).catch(err => {
          console.warn('[FCM Startup] Background token refresh non-fatal error:', err);
        });
      }
    }
  }, []);

  // Listen for real-time foreground FCM Push notifications
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    subscribeToForegroundMessages((payload) => {
      const severity: SeverityLevel = 
        (payload.data?.severity as SeverityLevel) || 'HIGH';
      
      const newNotif: InAppNotification = {
        id: `fcm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: payload.notification?.title || payload.data?.title || 'FCM Disaster Alert',
        message: payload.notification?.body || payload.data?.body || payload.data?.message || 'Incoming hazard alert received via FCM Web Push.',
        hazard_type: (payload.data?.hazard_type as any) || 'flood',
        severity: severity,
        ward_name: payload.data?.ward_name || 'Bhubaneswar Area',
        ward_id: typeof payload.data?.ward_id === 'number' ? payload.data.ward_id : (parseInt(String(payload.data?.ward_id || '').replace(/\D/g, ''), 10) || 1),
        timestamp: payload.data?.timestamp || new Date().toISOString(),
        read: false,
        channel: 'FCM_PUSH'
      };

      setNotifications(prev => [newNotif, ...prev]);
      playAlertTone(severity);
    }).then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [playAlertTone]);

  const triggerHazardAlert = (zone: HazardZone) => {
    // Deterministic rules:
    // LOW -> No notification
    // MODERATE -> In-app only
    // HIGH -> In-app + FCM + SMS
    // EMERGENCY -> In-app + FCM + SMS
    if (zone.severity === 'LOW') return;

    const channel = (zone.severity === 'EMERGENCY' || zone.severity === 'HIGH') 
      ? 'FCM_PUSH' 
      : 'IN_APP';

    const newAlert: InAppNotification = {
      id: `alert-${Date.now()}`,
      title: `${zone.severity}: ${(zone.hazard_type || 'HAZARD').replace('_', ' ').toUpperCase()} in ${zone.ward_name}`,
      message: zone.short_description || zone.description || 'Hazard alert active in your area.',
      hazard_type: zone.hazard_type,
      severity: zone.severity,
      ward_name: zone.ward_name,
      ward_id: zone.ward_id,
      timestamp: new Date().toISOString(),
      read: false,
      channel
    };

    setNotifications(prev => [newAlert, ...prev]);
    playAlertTone(zone.severity);

    // Local browser notification fallback
    if (permissionStatus === 'granted' && isPushEnabled) {
      try {
        new Notification(`NivaranAI [${zone.severity}]: ${zone.ward_name}`, {
          body: zone.short_description,
          icon: '/favicon.svg'
        });
      } catch (e) {
        console.log('Browser notification fallback note');
      }
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fcmToken,
        fcmLoading,
        fcmError,
        permissionStatus,
        isPushEnabled,
        soundEnabled,
        requestNotificationPermission,
        markAsRead,
        markAllAsRead,
        clearAll,
        toggleSound,
        triggerHazardAlert
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
