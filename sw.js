/* Service Worker — VentaMaestra 2.0 */

const CACHE_VERSION = 'vm-cache-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',

  '/manifest.webmanifest',
  '/offline.html',

  '/real.js',
  '/module.css',
  '/module.js',

  '/login.html',
  '/login.css',
  '/login.js',

  '/admin.html',
  '/admin.css',
  '/admin.js',

  '/products.html',
  '/products.js',

  '/customers.html',
  '/customers.js',

  '/inventory.html',
  '/inventory.js',

  '/reports.html',
  '/reports.js',

  '/pos.html',
  '/pos.css',
  '/pos.js',

  '/assets/icon.svg',
  '/assets/favicon.svg',
  '/assets/logo.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      await cache.addAll(PRECACHE_URLS);
      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

function isApiRequest(requestUrl) {
  return requestUrl.pathname.startsWith('/api/');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo maneja same-origin
  if (url.origin !== self.location.origin) return;

  // Nunca cachear API: siempre a red
  if (isApiRequest(url)) {
    event.respondWith(fetch(req));
    return;
  }

  // Navegación: intenta cache, si no, offline
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const cached = await caches.match(req);
          if (cached) return cached;
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_VERSION);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          const offline = await caches.match('/offline.html');
          return offline || new Response('Offline', { status: 503 });
        }
      })()
    );
    return;
  }

  // Assets (GET): cache-first
  if (req.method === 'GET') {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_VERSION);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          const offline = await caches.match('/offline.html');
          return offline || new Response('Offline', { status: 503 });
        }
      })()
    );
  }
});
