const CACHE_NAME = 'fll-v2';
const STATIC_ASSETS = ['/public/images/logo.webp', '/public/images/first_line_correct_logos_1.jpg'];

// SPA routes that should NEVER be cached — always fetch from network
const SPA_ROUTES = ['/admin', '/admin-panel', '/unified-login', '/login', '/courier', '/driver', '/forgot-password', '/application-status', '/dist/'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // NEVER cache SPA routes, HTML, or dist assets — always network-first
  const isSpaRoute = SPA_ROUTES.some(r => url.pathname.startsWith(r));
  const isHtml = e.request.headers.get('accept')?.includes('text/html');
  const isNavigation = e.request.mode === 'navigate';

  if (isSpaRoute || isHtml || isNavigation) {
    // Network only — no caching for SPA/HTML
    e.respondWith(fetch(e.request).catch(() => caches.match('/')));
    return;
  }

  // For static assets (images, fonts): network-first with cache fallback
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok && url.pathname.match(/\.(png|jpg|jpeg|webp|svg|woff2?|ico)$/)) {
        const clone = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return r;
    }).catch(() => caches.match(e.request))
  );
});
