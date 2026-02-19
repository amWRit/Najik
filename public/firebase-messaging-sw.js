// Give the service worker access to Firebase Messaging.
// Note: This should be loaded from CDN in production for better performance
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
// NOTE: Service workers cannot access process.env directly.
// For local dev, inject values at build time or use template literals.
firebase.initializeApp({
  apiKey: 'AIzaSyD985mMzDhEm2xOCqa5LQyutzhfjzIBw9Q',
  authDomain: 'najik-68f4d.firebaseapp.com',
  projectId: 'najik-68f4d',
  storageBucket: 'najik-68f4d.firebasestorage.app',
  messagingSenderId: '600093110199',
  appId: '1:600093110199:web:6daba0d9bded4e0c9ec232',
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Najik';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/images/logos/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: payload.data?.type || 'default',
    requireInteraction: payload.data?.type === 'sos_alert',
    data: payload.data,
    actions: payload.data?.type === 'sos_alert' ? [
      { action: 'view', title: 'View Location' },
      { action: 'acknowledge', title: 'Acknowledge' }
    ] : [
      { action: 'view', title: 'View' }
    ],
  };

  // Play sound for SOS alerts
  if (payload.data?.type === 'sos_alert') {
    self.registration.showNotification(notificationTitle, {
      ...notificationOptions,
      vibrate: [500, 200, 500, 200, 500],
    });
  } else {
    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.action === 'view' || !event.action
    ? '/helper'
    : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there is already a window/tab open with the target URL
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
