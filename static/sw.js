// MrGuyDetail Service Worker
// Version: 1.0.0

const CACHE_VERSION = 'mrguy-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Cache-first resources (static assets)
const CACHE_FIRST = [
  '/',
  '/manifest.json',
  '/favicons/android-chrome-192x192.png',
  '/favicons/android-chrome-512x512.png'
];

// Network-first resources (dynamic content)
const NETWORK_FIRST_PATTERNS = [
  /^\/api\//,
  /^\/book/,
  /^\/admin/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(CACHE_FIRST);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('mrguy-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Network-first for API and dynamic pages
  if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for static assets
  event.respondWith(cacheFirst(request));
});

// Cache-first strategy
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('[SW] Serving from cache:', request.url);
    return cached;
  }

  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response && response.status === 200) {
      const responseClone = response.clone();
      cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    
    // Return offline page if available
    const offlinePage = await cache.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
    
    throw error;
  }
}

// Network-first strategy
async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response && response.status === 200) {
      const responseClone = response.clone();
      cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    throw error;
  }
}

// Background sync for offline booking submissions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings());
  }
});

async function syncBookings() {
  // Implement booking sync logic here
  console.log('[SW] Syncing offline bookings...');
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'MrGuy Detail';
  const options = {
    body: data.body || 'You have a new update',
    icon: '/favicons/android-chrome-192x192.png',
    badge: '/favicons/android-chrome-192x192.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'View' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Focus existing window if open
          for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});
