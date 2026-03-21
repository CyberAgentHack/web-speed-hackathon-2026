const CACHE_NAME = 'cax-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // GET リクエストのみキャッシュ対象とする
  if (event.request.method !== 'GET') return;
  
  // API リクエストなどはキャッシュしない（または別途戦略を立てる）
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // キャッシュがあればそれを返し、なければネットワークから取得
      return response || fetch(event.request).then((fetchResponse) => {
        // 静的ファイル（scripts, styles, images など）は取得時にキャッシュに追加する
        if (fetchResponse.ok && (
          url.pathname.startsWith('/scripts/') || 
          url.pathname.startsWith('/styles/') || 
          url.pathname.startsWith('/images/') ||
          url.pathname.startsWith('/fonts/')
        )) {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return fetchResponse;
      });
    })
  );
});
