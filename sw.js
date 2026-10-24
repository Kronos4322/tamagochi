// Service worker : cache hors-ligne + notifications en arrière-plan.
const CACHE = 'tamagochi-v3';
const STATE_CACHE = 'tamagochi-state';
const FILES = ['./', 'index.html', 'style.css', 'game.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
const HOUR = 3600e3;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('tamagochi-v') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Réseau d'abord (pour recevoir les mises à jour), cache en secours.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Vérification périodique (Chrome Android, appli installée) :
// on estime l'état du monstre depuis la dernière sauvegarde.
self.addEventListener('periodicsync', (e) => {
  if (e.tag === 'tamagochi-check') e.waitUntil(checkPet());
});

async function checkPet() {
  const cache = await caches.open(STATE_CACHE);
  const res = await cache.match('state.json');
  if (!res) return;
  const s = await res.json();
  if (!s.alive) return;

  const now = Date.now();
  const meta = await cache.match('notified.json');
  const lastNotified = meta ? (await meta.json()).at : 0;
  if (now - lastNotified < 3 * HOUR) return;

  const h = (now - s.last) / HOUR;
  const slow = s.asleep ? 0.35 : 1;
  const reasons = [];
  if (s.hunger - 5 * h * slow < 25) reasons.push('a faim 🍙');
  if (s.happy - 4 * h * slow < 25) reasons.push("s'ennuie 💛");
  if (s.sick) reasons.push('est malade 💊');
  if (s.poops > 0 || h > 4) reasons.push('a sûrement fait des crottes 💩');
  if (!reasons.length) return;

  await self.registration.showNotification(`${s.name} a besoin de toi !`, {
    body: `${s.name} ${reasons.join(', ')}`,
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    tag: 'tamagochi',
  });
  await cache.put('notified.json', new Response(JSON.stringify({ at: now })));
}

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((list) => (list[0] ? list[0].focus() : self.clients.openWindow('./')))
  );
});
