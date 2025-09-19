// A more robust service worker for caching and dynamic content

const CACHE_NAME = 'melofy-cache-v2'; // Version bumped to trigger update
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display.swap',
  'https://i.ibb.co/TDt1SgGH/7d41b8ed-0b55-4aef-bc8e-6d20ea913649.jpg'
];

// Install event: opens a cache and adds the app shell files to it.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // Force the waiting service worker to become the active one.
});

// Activate event: cleans up old, unused caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control of all open clients immediately.
});


// Fetch event: implements a cache-first, then network fallback with dynamic caching.
self.addEventListener('fetch', event => {
  // We only want to handle GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // If the resource is in the cache, return it.
        if (cachedResponse) {
          return cachedResponse;
        }

        // If not in cache, fetch it from the network.
        return fetch(event.request)
          .then(networkResponse => {
            // A response is a stream and can only be consumed once.
            // We need to clone it to put one copy in the cache and send one to the browser.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Cache the new resource for future use.
                // We only cache valid responses to avoid caching errors.
                if (networkResponse && networkResponse.status === 200) {
                    cache.put(event.request, responseToCache);
                }
              });

            return networkResponse;
          });
      }).catch(error => {
        // Handle cases where both cache and network fail.
        // You could optionally return a pre-cached offline fallback page here.
        console.error('Fetch failed; user is likely offline.', error);
      })
  );
});
