const CACHE = 'weekly-planner-v3';

const ASSETS = [
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap',
  'https://fonts.gstatic.com'
];

// Install: cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // Cache local assets; fonts may fail if offline during install — that's OK
      return cache.addAll(['./index.html', './manifest.json']).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache, fall back to network, cache new responses
self.addEventListener('fetch', e => {
  // Skip non-GET and browser-extension requests
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache successful responses for same-origin and font requests
        if (response && response.status === 200) {
          const url = e.request.url;
          if (url.includes(self.location.origin) || url.includes('fonts.g')) {
            const clone = response.clone();
            caches.open(CACHE).then(cache => cache.put(e.request, clone));
          }
        }
        return response;
      }).catch(() => {
        // If both cache and network fail, return the app shell for navigation requests
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
