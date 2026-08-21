/* eslint-disable no-undef */
// ============================================================================
// NivaranAI - Firebase Cloud Messaging (FCM) Web Push Service Worker
// Project: apada-sathi-271b0
// ============================================================================

importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAzsNjTWYH1fCRogQ2rQ4iTlAKwbKZgKgs",
  authDomain: "apada-sathi-271b0.firebaseapp.com",
  projectId: "apada-sathi-271b0",
  storageBucket: "apada-sathi-271b0.firebasestorage.app",
  messagingSenderId: "805776099887",
  appId: "1:805776099887:web",
  measurementId: "G-4Y0LC8BLRJ"
};

// Initialize Firebase in Service Worker scope
firebase.initializeApp(firebaseConfig);

let messaging = null;
try {
  messaging = firebase.messaging();
} catch (err) {
  console.warn('[firebase-messaging-sw.js] Failed to initialize firebase.messaging():', err);
}

// Background push notification listener
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const title = payload.notification?.title || payload.data?.title || 'NivaranAI Disaster Alert';
    const body = payload.notification?.body || payload.data?.body || payload.data?.message || 'Emergency hazard update in your area.';
    const icon = payload.notification?.icon || payload.data?.icon || '/favicon.svg';
    const tag = payload.data?.tag || payload.data?.hazard_type || 'nivaran-alert';

    const notificationOptions = {
      body: body,
      icon: icon,
      badge: '/favicon.svg',
      tag: tag,
      requireInteraction: payload.data?.severity === 'EMERGENCY' || payload.data?.severity === 'HIGH',
      data: {
        url: payload.data?.url || '/',
        timestamp: payload.data?.timestamp || new Date().toISOString(),
        severity: payload.data?.severity || 'HIGH',
        ward_id: payload.data?.ward_id || null,
        ...payload.data
      }
    };

    return self.registration.showNotification(title, notificationOptions);
  });
}

// Notification Click Handler - Focus existing app tab or open new window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
