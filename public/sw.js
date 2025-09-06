
// A basic service worker for PWA functionality

const CACHE_NAME = 'phunt-cache-v1';
const urlsToCache = [
  '/',
  '/discovery',
  '/games',
  // You would add your main JS and CSS files here.
  // Next.js generates hashed filenames, so a more robust solution
  // would inject these filenames during the build process.
];

// Install event: fires when the service worker is first installed.
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Service Worker: Caching failed', err))
  );
});

// Activate event: fires when the service worker becomes active.
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});


// Fetch event: fires for every network request.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});


// === PUSH NOTIFICATION LOGIC ===

self.addEventListener('push', event => {
  console.log('[Service Worker] Push Received.');
  const data = event.data.json();
  console.log('[Service Worker] Push data:', data);

  const title = data.title || 'New Notification';
  const options = {
    body: data.body || 'Something new happened!',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({
      type: "window"
    }).then(clientList => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
