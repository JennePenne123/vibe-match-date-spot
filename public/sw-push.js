/* eslint-disable */
// H!Outz push-notification worker.
// Imported into the Workbox-generated /sw.js via `importScripts`.
// Handles ONLY push notifications, notification clicks and background sync.
// App-shell/offline caching is owned by Workbox in the generated sw.js.

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