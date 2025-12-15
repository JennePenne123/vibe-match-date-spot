// VybePulse Service Worker for Push Notifications

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

// Handle service worker install
self.addEventListener('install', function(event) {
  console.log('[SW] Service Worker installed');
  self.skipWaiting();
});

// Handle service worker activate
self.addEventListener('activate', function(event) {
  console.log('[SW] Service Worker activated');
  event.waitUntil(self.clients.claim());
});
