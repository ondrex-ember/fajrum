// Sklářská Huť — Service Worker
// Network-first pro HTML, cache-first pro assets

// ⚠️ Zvedni verzi při každém releasu → vynutí nový cache
const CACHE = 'sklarska-hut-v791';
const ASSETS = [
  '/',
  '/index.html',
  '/about.html',
  '/intro.jpg',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install — cache všechny assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate — vymaž staré cache
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network-first pro HTML navigace, cache-first pro ostatní assets
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // HTML navigace vždy nejdřív ze sítě → uživatel dostane novou verzi okamžitě
  // Fallback na cache pouze při offline
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Assets (JS, CSS, obrázky) — cache-first, network fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
