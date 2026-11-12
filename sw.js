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
        if (freshPage.ok) await storePage(cache, freshPage.clone());
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

/* Store a freshly downloaded copy of the page. The copy it replaces becomes
   the "previous version" — but only when the page has actually changed.
   Snapshotting on every load meant the second visit after an update put the
   new page into the snapshot too, so the rollback served the same version. */
async function storePage(cache, response) {
  const old = await cache.match(PAGE_URL);
  if (old) {
    const [oldText, newText] = await Promise.all([old.clone().text(), response.clone().text()]);
    if (oldText === newText) return;
    await cache.put(PREV_URL, old);
  }
  await cache.put(PAGE_URL, response);
}

/* Only a successful response is kept: a 404 or 500 from a hosting hiccup
   must never replace the good copy the phone relies on offline. */
function networkFirst(cache, request) {
  return fetch(request)
    .then(response => {
      if (!response.ok) {
        return cache.match(PAGE_URL).then(hit => hit || response);
      }
      return storePage(cache, response.clone()).catch(() => {}).then(() => response);
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
  /* Only this site's own files are cached; anything else goes straight to
     the network untouched. */
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then(hit => hit || fetch(event.request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});
