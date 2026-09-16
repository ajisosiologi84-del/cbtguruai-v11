const CACHE_NAME = 'cbt-guru-app-v2';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/warning-alarm.mp3',
  '/warning-alarm.wav'
];

// Install: Cache core application shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching CBT Application Core Assets');
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Partial cache install:', err);
      });
    })
  );
});

// Activate: Clean up older cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing stale cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy: Stale-While-Revalidate for local app bundle & Cache-First for assets
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Ignore non-GET or cross-domain Firestore / Analytics requests
  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;

  // Handle local app shell and assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          console.log('[ServiceWorker] Network offline, relying on cached shell for:', request.url);
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
