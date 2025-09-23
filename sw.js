const CACHE_NAME = 'melofy-cache-v1';
const urlsToCache = [
  '/',
  '/index.html'
  // Add other static assets here if they are not inlined, e.g., '/style.css'
];

// Install event: caches the core application shell.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch event: serves assets from cache first for offline capability.
self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network, then cache it.
        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and can only be consumed once. We need one for the browser
            // and one for the cache.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // We don't cache API calls to avoid stale data.
                // Adjust this condition if you have other API endpoints.
                if (!event.request.url.includes('/search/') && !event.request.url.includes('/lyrics')) {
                    cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        );
      })
    );
});

// Activate event: cleans up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});
