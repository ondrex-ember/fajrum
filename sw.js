// Sklářská Huť — Service Worker
// Network-first pro HTML, cache-first pro assets

// ⚠️ Zvedni verzi při každém releasu → vynutí nový cache
const CACHE = 'sklarska-hut-woodland-v1';
const ASSETS = [
  '/img/world/hut-winter-thinned.webp',
  '/img/world/hut-spring-thinned.webp',
  '/img/world/hut-summer-thinned.webp',
  '/img/world/hut-autumn-thinned.webp',
  '/img/world/hut-winter-cleared.webp',
  '/img/world/hut-spring-cleared.webp',
  '/img/world/hut-summer-cleared.webp',
  '/img/world/hut-autumn-cleared.webp',
  '/ui/fajrum-partners.js',
  '/ui/fajrum-partners.css',
  '/img/partners/weiss.webp',
  '/img/partners/hoffmann.webp',
  '/img/partners/abbot.webp',
  '/img/partners/priest.webp',
  '/img/partners/nobleman.webp',
  '/img/partners/noblewoman.webp',

  '/img/events/crack.webp',
  '/img/events/good.webp',
  '/img/events/merchant.webp',
  '/img/events/winter.webp',
  '/img/events/shamotCrack.webp',
  '/img/events/forestDepleted.webp',
  '/img/events/svjiri.webp',
  '/img/achievements/ignis_mutat_res.webp',
  '/img/achievements/tercikar.webp',
  '/img/achievements/speculum.webp',
  '/img/achievements/kunckel.webp',
  '/img/achievements/reticello.webp',
  '/img/achievements/barokni_prelom.webp',
  '/img/achievements/ceska_pec.webp',
  '/img/achievements/cerenic_arsenem.webp',
  '/img/achievements/vilkum.webp',
  '/img/achievements/kobaltova_serie.webp',
  '/img/achievements/faccon_de_venise.webp',
  '/ui/fajrum-stories.js',
  '/ui/fajrum-stories.css',
  '/img/furnaces/primitive-cold.webp',
  '/img/furnaces/primitive-embers.webp',
  '/img/furnaces/primitive-hot.webp',
  '/img/furnaces/stone-cold.webp',
  '/img/furnaces/stone-embers.webp',
  '/img/furnaces/stone-hot.webp',
  '/img/furnaces/master-cold.webp',
  '/img/furnaces/master-embers.webp',
  '/img/furnaces/master-hot.webp',
  '/ui/fajrum-worksites.js',
  '/ui/fajrum-worksites.css',
  '/img/worksites/potash.webp',
  '/img/worksites/grinding.webp',
  '/img/worksites/engraving.webp',
  '/img/worksites/forestry.webp',
  '/ui/fajrum-desktop.js',
  '/ui/fajrum-desktop.css',
  '/ui/fajrum-portraits.js',
  '/ui/fajrum-portraits.css',
  '/img/workers/tomislav.webp',
  '/img/workers/npc_formar2.webp',
  '/img/workers/npc_foukac2.webp',
  '/img/workers/npc_foukac3.webp',
  '/img/workers/npc_foukac4.webp',
  '/img/workers/npc_foukac5.webp',
  '/img/workers/npc_foukac6.webp',
  '/img/workers/npc_hrana1.webp',
  '/img/workers/npc_kulic1.webp',
  '/img/workers/npc_rytec1.webp',
  '/img/materials/limestone.webp',
  '/img/materials/water.webp',
  '/img/materials/clay.webp',
  '/img/materials/shamot.webp',
  '/img/materials/food.webp',
  '/img/materials/charcoal.webp',
  '/img/materials/stone.webp',
  '/img/materials/dryWood.webp',
  '/img/materials/firebrick.webp',
  '/img/materials/pitch.webp',
  '/img/additives/smolka.webp',
  '/img/additives/burel.webp',
  '/img/additives/aesUstum.webp',
  '/img/additives/crocusMartis.webp',
  '/img/additives/cin.webp',
  '/img/additives/olovo.webp',
  '/img/additives/antimon.webp',
  '/img/additives/zlato.webp',
  '/img/additives/rtut.webp',
  '/img/additives/stribro.webp',
  '/img/additives/arsen.webp',
  '/',
  '/index.html',
  '/about.html',
  '/intro.jpg',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/ui/fajrum-mobile.css',
  '/ui/fajrum-ui.js',
  '/ui/grain.svg',
  '/ui/fajrum-artwork.js',
  '/ui/fajrum-artwork.css',
  '/ui/fajrum-products.js',
  '/ui/fajrum-products.css',
  '/ui/fajrum-recipes.js',
  '/ui/fajrum-recipe-ui.js',
  '/ui/fajrum-crew.js',
  '/ui/fajrum-crew.css',
  '/ui/fajrum-market.js',
  '/ui/fajrum-market.css',
  '/ui/fajrum-visuals.js',
  '/ui/fajrum-visuals.css',
  '/img/sections/production.webp',
  '/img/sections/storage.webp',
  '/img/sections/market.webp',
  '/img/sections/accounts.webp',
  '/img/sections/chronicle.webp',
  '/img/sections/archive.webp',
  '/img/sections/commission-church.webp',
  '/img/sections/commission-noble.webp',
  '/img/sections/commission-trade.webp',
  '/img/materials/panev.webp',
  '/img/materials/formy.webp',
  '/img/materials/wood.webp',
  '/img/materials/potash.webp',
  '/img/materials/sand.webp',
  '/img/products/historical-catalogue.webp',
  '/img/products/hodiny.webp',
  '/img/products/glass-atlas-alpha.webp',
  '/img/products/glass-special-alpha.webp',
  '/img/products/mucholapka.webp',
  '/img/products/figurka.webp',
  '/img/products/kutrolf.webp',
  '/img/products/stangenglas.webp',
  '/img/products/tercik.webp',
  '/img/products/alembik.webp',
  '/img/world/hut-winter.webp',
  '/img/world/hut-spring.webp',
  '/img/world/hut-summer.webp',
  '/img/world/hut-autumn.webp',
  '/img/world/furnace-cold.webp',
  '/img/world/furnace-embers.webp',
  '/img/world/furnace-hot.webp',
  '/img/workers/baranovsky.jpg',
  '/img/workers/formar1.jpg',
  '/img/workers/foukac1.jpg',
  '/img/workers/kaninsky.jpg',
  '/img/workers/komar.jpg',
  '/img/workers/kunc.jpg',
  '/img/workers/mana.jpg',
  '/img/workers/smrkovsky.jpg',
  '/img/workers/taborsky.jpg'
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

  // Cizí domény (GTM, GA, …) nechat na prohlížeči — SW je necachuje ani nepodvrhuje
  if (new URL(e.request.url).origin !== self.location.origin) return;

  // HTML navigace vždy nejdřív ze sítě → uživatel dostane novou verzi okamžitě
  // Fallback na cache pouze při offline
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.open(CACHE).then(c => c.match('/index.html')))
    );
    return;
  }

  // Assets — číst pouze aktuální verzi, i když starý SW ještě dokončuje požadavky.
  e.respondWith(
    caches.open(CACHE).then(c => c.match(e.request)).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => Response.error()); // chybějící asset = chyba, ne podvržené HTML
    })
  );
});
