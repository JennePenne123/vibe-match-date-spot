// VybePulse Service Worker for Push Notifications and Offline Support

const CACHE_VERSION = 'v1';
const CACHE_NAME = `vybepulse-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/placeholder.svg'
];

// API endpoints to cache (network-first with fallback)
const API_CACHE_PATTERNS = [
  '/rest/v1/venues',
  '/rest/v1/profiles',
  '/rest/v1/user_preferences'
];

// Handle service worker install
self.addEventListener('install', function(event) {
  console.log('[SW] Service Worker installing, cache version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Handle service worker activate - cleanup old caches
self.addEventListener('activate', function(event) {
  console.log('[SW] Service Worker activated');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('vybepulse-') && name !== CACHE_NAME)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Handle fetch events with caching strategies
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests except for Supabase
  if (!url.origin.includes(self.location.origin) && !url.origin.includes('supabase')) {
    return;
  }
  
  // API requests: Network-first with cache fallback
  const isApiRequest = API_CACHE_PATTERNS.some(pattern => url.pathname.includes(pattern));
  
  if (isApiRequest) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone and cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          console.log('[SW] Network failed, trying cache for:', url.pathname);
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Static assets: Cache-first with network fallback
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached version and update cache in background
          fetch(event.request).then(response => {
            if (response.ok) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, response);
              });
            }
          }).catch(() => {});
          
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(event.request).then(response => {
          // Cache successful responses for static assets
          if (response.ok && (url.pathname.endsWith('.js') || 
              url.pathname.endsWith('.css') || 
              url.pathname.endsWith('.png') || 
              url.pathname.endsWith('.svg') ||
              url.pathname.endsWith('.ico'))) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
  );
});

// Handle push events from the server
self.addEventListener('push', function(event) {
  console.log('[SW] Push received:', event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    tag: data.type || 'general',
    renotify: true,
    requireInteraction: data.type === 'invitation_received',
    data: {
      url: data.url || '/',
      type: data.type,
      dateOfArrival: Date.now()
    },
    actions: data.actions || []
  };

  const title = data.title || 'VybePulse';
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification clicked:', event);
  event.notification.close();

  const url = event.notification.data?.url || '/';

  // Handle action button clicks
  if (event.action === 'view') {
    event.waitUntil(navigateToUrl('/invitations'));
  } else if (event.action === 'dismiss') {
    // Just close the notification
  } else {
    // Default click behavior - navigate to the URL
    event.waitUntil(navigateToUrl(url));
  }
});

// Helper function to navigate to a URL
async function navigateToUrl(url) {
  const windowClients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  });

  // Try to find an existing window to focus
  for (const client of windowClients) {
    if (client.url.includes(self.location.origin) && 'focus' in client) {
      await client.focus();
      if (client.navigate) {
        await client.navigate(url);
      }
      return;
    }
  }

  // If no existing window, open a new one
  if (self.clients.openWindow) {
    return self.clients.openWindow(url);
  }
}

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('[SW] Notification closed:', event);
});

// Handle background sync for offline actions
self.addEventListener('sync', function(event) {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-feedback') {
    event.waitUntil(syncPendingFeedback());
  }
});

// Sync pending feedback when back online
async function syncPendingFeedback() {
  try {
    // Get pending feedback from IndexedDB or localStorage
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE', tag: 'sync-feedback' });
    });
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Handle messages from the main app
self.addEventListener('message', function(event) {
  console.log('[SW] Message received:', event.data);
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
    });
  }
});
