// キャッシュ名にページ内容のハッシュを含め、更新時に古いキャッシュを捨てる
const CACHE = 'saa-tangocho-2f839372fba1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// ページ本体（index.html）はネットワーク優先: オンラインなら常に最新版、オフラインならキャッシュ。
// アイコンとマニフェストはキャッシュ優先
const isPage = (request) => {
  const path = new URL(request.url).pathname;
  return request.mode === 'navigate' || path.endsWith('/') || path.endsWith('/index.html');
};

const networkFirst = (request) =>
  fetch(request)
    .then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request.url, copy));
      }
      return response;
    })
    .catch(() => caches.match(request, { ignoreSearch: true }).then((hit) => hit || caches.match('./')));

const cacheFirst = (request) =>
  caches.match(request, { ignoreSearch: true }).then((hit) => hit || fetch(request));

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(isPage(event.request) ? networkFirst(event.request) : cacheFirst(event.request));
});
