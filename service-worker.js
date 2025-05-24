
const CACHE_NAME = 'mistral-chat-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx', // Main application script
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png'
  // Note: esm.sh URLs are cached dynamically by the fetch handler
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching core assets');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache core assets during install:', error);
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Strategy for esm.sh URLs: Network first, then cache.
  if (requestUrl.hostname === 'esm.sh') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.ok && event.request.method === 'GET') {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          console.log(`Network request for ${event.request.url} failed, trying cache.`);
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          console.error(`Failed to fetch ${event.request.url} from network and not in cache.`);
          // Return a basic error response or let the browser handle it.
          // For critical JS modules, this might lead to app failure if not cached.
          return new Response('Network error and not in cache', {
            status: 404,
            statusText: 'Not Found'
          });
        }
      })
    );
    return;
  }

  // Strategy for other requests (local assets): Cache first, then network.
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then(
          networkResponse => {
            if (networkResponse && networkResponse.ok && event.request.method === 'GET') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          }
        ).catch(error => {
          console.error('Fetching failed for local asset:', event.request.url, error);
          // For navigation requests, you might want to serve a fallback offline page.
          if (event.request.mode === 'navigate') {
            // Example: return caches.match('/offline.html');
            // Ensure '/offline.html' is in urlsToCache if you use this.
          }
          // Rethrow to let the browser handle the error for non-navigation requests.
          // Or return a generic error response.
          return new Response('Network error occurred', {
            status: 503, // Service Unavailable
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

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
    }).then(() => self.clients.claim())
  );
});
