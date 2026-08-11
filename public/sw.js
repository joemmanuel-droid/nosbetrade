// Service worker minimal : ne met en cache QUE l'app shell (statique, public).
// Le contenu du livre et les figures ne sont jamais mis en cache ici — ce sont
// des routes privees gardees par cookie de session, et les mettre en cache
// cote client exposerait le contenu paye sur un appareil partage apres
// deconnexion. Seul le confort de chargement de l'interface est vise.

const VERSION = 'v1';
const SHELL_CACHE = `nosbe-shell-${VERSION}`;

const SHELL_ASSETS = ['/manifest.webmanifest', '/hors-ligne', '/apple-touch-icon.png', '/favicon-32.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Jamais de cache pour l'API ou les pages privees : toujours reseau.
  if (url.pathname.startsWith('/api/')) return;

  // Assets statiques Next (hashes dans l'URL) : cache-first, ils ne changent jamais de contenu.
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      }),
    );
    return;
  }

  // Navigations : reseau d'abord, repli sur la page hors-ligne si injoignable.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/hors-ligne').then((r) => r || Response.error())),
    );
  }
});
