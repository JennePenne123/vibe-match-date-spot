// VybePulse Service Worker for Push Notifications and Offline Support

const CACHE_VERSION = 'v2';
const CACHE_NAME = `vybepulse-${CACHE_VERSION}`;

// Only cache stable public assets here.
// Never cache the app shell (/, /index.html) or JS/CSS bundles,
// otherwise UI updates can get stuck on old versions.
const STATIC_ASSETS = [
  '/manifest.json',
  '/placeholder.svg',
  '/favicon.ico'
];

// API endpoints to cache (network-first with fallback)
const API_CACHE_PATTERNS = [
  '/rest/v1/venues',
  '/rest/v1/profiles',
  '/rest/v1/user_preferences'
];

const isCacheableStaticAsset = (pathname) => {
  return (
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2')
  );
};

self.addEventListener('install', function(event) {
  console.log('[SW] Service Worker installing, cache version:', CACHE_VERSION);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching stable public assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

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

self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') {
    return;
  }

  if (!url.origin.includes(self.location.origin) && !url.origin.includes('supabase')) {
    return;
  }

  const isApiRequest = API_CACHE_PATTERNS.some(pattern => url.pathname.includes(pattern));
  const isNavigationRequest = event.request.mode === 'navigate';

  // Always fetch navigations from network so the latest UI is shown.
  if (isNavigationRequest) {
    event.respondWith(fetch(event.request));
    return;
  }

  // API requests: Network-first with cache fallback
  if (isApiRequest) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
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

  // Never cache JS, CSS, or HTML documents to avoid stale app versions.
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.html')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Static media assets: cache-first with network refresh
  if (isCacheableStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          fetch(event.request)
            .then(response => {
              if (response.ok) {
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, response.clone());
                });
              }
            })
            .catch(() => {});

          return cachedResponse;
        }

        return fetch(event.request).then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
  }
});

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

self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification clicked:', event);
  event.notification.close();

  const url = event.notification.data?.url || '/';

  if (event.action === 'view') {
    event.waitUntil(navigateToUrl('/invitations'));
  } else if (event.action === 'dismiss') {
    // Just close the notification
  } else {
    event.waitUntil(navigateToUrl(url));
  }
});

async function navigateToUrl(url) {
  const windowClients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  });

  for (const client of windowClients) {
    if (client.url.includes(self.location.origin) && 'focus' in client) {
      await client.focus();
      if (client.navigate) {
        await client.navigate(url);
      }
      return;
    }
  }

  if (self.clients.openWindow) {
    return self.clients.openWindow(url);
  }
}

self.addEventListener('notificationclose', function(event) {
  console.log('[SW] Notification closed:', event);
});

self.addEventListener('sync', function(event) {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-feedback') {
    event.waitUntil(syncPendingFeedback());
  }
});

async function syncPendingFeedback() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE', tag: 'sync-feedback' });
    });
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

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
