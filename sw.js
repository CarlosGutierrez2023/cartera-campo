/* TOPCAD · Service Worker — soporte sin conexión */
const CACHE = 'topcad-v1';

/* Recursos locales que se precargan al instalar */
const CORE = [
  'index.html',
  'cartera.html',
  'origen.html',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'favicon-64.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Estrategia:
   - Navegación/HTML y recursos locales: cache primero, con respaldo a red.
   - CDN (Bootstrap, fuentes, etc.): se cachean la primera vez que se cargan
     (stale-while-revalidate), para que después funcionen sin conexión. */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  e.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        if (res && res.status === 200 &&
            (res.type === 'basic' || res.type === 'cors')) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(()=>{});
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
