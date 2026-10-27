const CACHE = 'axxcalender-dev';
// Relative paths, resolved against the registration scope, so the worker
// works identically at domain root and under a project subpath
// (e.g. GitHub Pages /axxcalender/). Replaced at build time by
// scripts/precache.mjs with the full hashed asset list.
const PRECACHE_URLS = ['./', 'icon.svg', 'manifest.webmanifest'];
const scopeUrl = self.registration.scope;
const toAbsolute = (path) => new URL(path, scopeUrl).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS.map(toAbsolute)))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Do not cache Vite development modules or the HMR client.
  const scopePath = new URL(scopeUrl).pathname;
  const relativePath = url.pathname.startsWith(scopePath)
    ? url.pathname.slice(scopePath.length)
    : url.pathname.replace(/^\//, '');
  if (
    relativePath.startsWith('src/') ||
    relativePath.startsWith('@') ||
    relativePath.startsWith('node_modules/')
  ) {
    return;
  }
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        // ignoreVary matters: precache fetches are made by the worker
        // without an Origin header, while module scripts/stylesheets are
        // CORS requests that carry one. Behind servers that respond with
        // `Vary: Origin` (e.g. Vite preview), a strict match would miss
        // and the offline page would load without its JS/CSS.
        const cached = await caches.match(request, { ignoreVary: true });
        if (cached) return cached;
        if (request.mode === 'navigate') {
          const fallback =
            (await caches.match(toAbsolute('./'), { ignoreVary: true })) ||
            (await caches.match(toAbsolute('index.html'), { ignoreVary: true }));
          if (fallback) return fallback;
        }
        return Response.error();
      }
    })(),
  );
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url
    ? new URL(event.notification.data.url, scopeUrl).href
    : scopeUrl;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) if ('focus' in client) return client.focus();
      return self.clients.openWindow(target);
    }),
  );
});
