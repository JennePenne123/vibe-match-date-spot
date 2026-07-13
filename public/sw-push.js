/* eslint-disable */
// H!Outz push-notification worker.
// Imported into the Workbox-generated /sw.js via `importScripts`.
// Handles push notifications, notification clicks, background sync AND the
// navigation/offline fallback.
// Asset precaching is owned by Workbox in the generated sw.js; navigation
// requests are handled here so we can serve a dedicated offline fallback page
// when neither the network nor the cached app shell is available.

// ---------------------------------------------------------------------------
// Navigation + offline fallback
// ---------------------------------------------------------------------------
// This listener is registered before Workbox's routes (importScripts runs at
// the top of the generated sw.js), so it owns navigation requests. Workbox is
// configured WITHOUT a navigate route/navigateFallback to avoid a conflict.
const OFFLINE_FALLBACK_URL = '/offline.html';
const APP_SHELL_URL = '/index.html';

self.addEventListener('fetch', function (event) {
  const request = event.request;

  // Only intercept top-level navigations (page loads / SPA route entries).
  if (request.mode !== 'navigate') return;

  const url = new URL(request.url);

  // Never touch OAuth callbacks – let them hit the network directly.
  if (url.pathname.startsWith('/~oauth') || url.pathname.startsWith('/auth/v1')) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Network-first: UI updates ship immediately when online.
        return await fetch(request);
      } catch (err) {
        // Offline: serve the precached app shell so the SPA can boot…
        const shell = await caches.match(APP_SHELL_URL, { ignoreSearch: true });
        if (shell) return shell;

        // …otherwise fall back to the dedicated offline page.
        const offline = await caches.match(OFFLINE_FALLBACK_URL, { ignoreSearch: true });
        if (offline) return offline;

        // Last resort if nothing is cached at all.
        return Response.error();
      }
    })()
  );
});

self.addEventListener('push', function (event) {
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
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    tag: data.type || 'general',
    renotify: true,
    requireInteraction: data.type === 'invitation_received',
    data: {
      url: data.url || '/',
      type: data.type,
      dateOfArrival: Date.now(),
    },
    actions: data.actions || [],
  };

  const title = data.title || 'H!Outz';
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  if (event.action === 'view') {
    event.waitUntil(navigateToUrl('/invitations'));
  } else if (event.action === 'dismiss') {
    // no-op
  } else {
    event.waitUntil(navigateToUrl(url));
  }
});

async function navigateToUrl(url) {
  const windowClients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
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

self.addEventListener('sync', function (event) {
  if (event.tag === 'sync-feedback') {
    event.waitUntil(syncPendingFeedback());
  }
});

async function syncPendingFeedback() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: 'SYNC_COMPLETE', tag: 'sync-feedback' });
    });
  } catch (error) {
    console.error('[SW-Push] Sync failed:', error);
  }
}

self.addEventListener('message', function (event) {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});