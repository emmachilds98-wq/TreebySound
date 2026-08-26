const CACHE = 'treebysound-v4';
const PAGE_URL = './index.html';
const PREV_URL = './__prev_index__';
const FLAG_URL = './__use_previous__';
const OTHER_ASSETS = ['./', './treebysound-icon.png', './manifest.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(async cache => {
      await cache.addAll(OTHER_ASSETS);
      /* Snapshot whatever page was already cached as the "previous version"
         before overwriting it — otherwise a fresh install would clobber the
         one copy the rollback button depends on before it's ever used. On a
         first-ever install there's nothing cached yet, so nothing to snapshot. */
      try {
        const freshPage = await fetch(PAGE_URL, { cache: 'reload' });
        const oldPage = await cache.match(PAGE_URL);
        if (oldPage) await cache.put(PREV_URL, oldPage);
        await cache.put(PAGE_URL, freshPage.clone());
      } catch (e) { /* offline install — keep whatever is already cached */ }
      self.skipWaiting();
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Flip to the last version snapshotted before an update, or back to normal,
   on request from the page (the "Use previous version" button). Answers on
   the reply port so the page knows whether a previous copy actually exists
   before it reloads into it. */
self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type !== 'USE_PREVIOUS') return;
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.all([
        cache.put(FLAG_URL, new Response(data.value ? '1' : '0')),
        cache.match(PREV_URL)
      ]).then(([, prev]) => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ ok: true, hasPrevious: !!prev });
        }
      })
    )
  );
});

function networkFirst(cache, request) {
  return fetch(request)
    .then(response => {
      const copy = response.clone();
      return cache.match(PAGE_URL).then(old => {
        const keepOld = old ? cache.put(PREV_URL, old) : Promise.resolve();
        return keepOld.then(() => cache.put(PAGE_URL, copy)).then(() => response);
      });
    })
    .catch(() => cache.match(request).then(hit => hit || cache.match(PAGE_URL)));
}

/* The book itself is network-first so edits show up as soon as you're online;
   everything else (icon, manifest) is cache-first since it rarely changes.
   Either way, offline always falls back to the last cached copy. Unless the
   "use previous version" flag is set, in which case the snapshot from before
   the last update is served instead, network or no network. */
self.addEventListener('fetch', event => {
  const isPage = event.request.mode === 'navigate' || event.request.destination === 'document';
  if (isPage) {
    event.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(FLAG_URL)
          .then(flagRes => flagRes ? flagRes.text() : '0')
          .then(flag => flag === '1'
            ? cache.match(PREV_URL).then(prev => prev || networkFirst(cache, event.request))
            : networkFirst(cache, event.request)
          )
      )
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(hit => hit || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
      return response;
    }))
  );
});
