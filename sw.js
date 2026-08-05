// G8スコア計算ツール - Service Worker
// オフラインでも起動できるよう、必要なファイルをキャッシュします。

const CACHE_NAME = 'g8-score-cache-v1';
const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json'
];

// インストール時に必要なファイルをキャッシュ
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // 一部の環境（file://等）ではキャッシュに失敗する場合がありますが無視して続行します
      });
    })
  );
});

// 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// キャッシュ優先、なければネットワークから取得
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          // 取得できたファイルは以後のオフライン利用のためキャッシュに保存
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          // オフラインかつキャッシュにも無い場合、メインページで代替
          return caches.match('./index.html');
        });
    })
  );
});
