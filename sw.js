const CACHE_NAME = 'fll-v2';
const ASSETS = ['/', '/public/images/logo.webp', '/public/images/first_line_correct_logos_1.jpg', '/fll-shared.js'];

// API domains that should never be cached
const NO_CACHE = ['execute-api.me-south-1.amazonaws.com', 'supabase.co'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // Never cache API responses (may contain tokens/sensitive data)
  const url = new URL(e.request.url);
  if (NO_CACHE.some(d => url.hostname.includes(d)) || url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
    return;
  }

  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) {
        const clone = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return r;
    }).catch(() => caches.match(e.request))
  );
});
