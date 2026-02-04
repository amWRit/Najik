const CACHE_NAME = 'najik-v1';
const RUNTIME_CACHE = 'najik-runtime-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/auth/login',
  '/auth/register',
  '/parent',
  '/helper',
  '/sounds/sos-alarm.mp3',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/manifest.json',
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching precache assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline, with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and external domains
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // Network first for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return new Response(
            JSON.stringify({ error: 'Offline - request failed' }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 503,
            }
          );
        })
    );
    return;
  }

  // Cache first for assets, network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the fetched response for runtime
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Return offline page if available
          return caches.match('/offline.html').then((offlineResponse) => {
            return offlineResponse || new Response('Offline');
          });
        });
    })
  );
});

// Background sync for location updates (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-location-updates') {
    event.waitUntil(syncLocationUpdates());
  }
});

async function syncLocationUpdates() {
  // Implement background sync logic here
  console.log('Syncing location updates in background');
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-location') {
    event.waitUntil(updateLocation());
  }
});

async function updateLocation() {
  console.log('Periodic location update');
}

// Push notification display
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: data.type === 'sos_alert' ? [500, 200, 500, 200, 500] : [200, 100, 200],
    data: data.data || {},
    requireInteraction: data.type === 'sos_alert',
    actions: data.type === 'sos_alert' ? [
      { action: 'view', title: 'View Location' },
      { action: 'acknowledge', title: 'Acknowledge' }
    ] : [
      { action: 'view', title: 'View' }
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Najik', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.action === 'view' || !event.action
    ? '/helper'
    : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there is already a window/tab open
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes(urlToOpen) && 'focus' in client) {
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
