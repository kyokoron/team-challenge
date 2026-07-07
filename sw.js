// Service Worker：近場のオフライン対応。
//  - 同一オリジンのアプリ本体・データ … network-first（オンライン時は最新、圏外時はキャッシュ）
//  - 地図/ハザードタイル・CDN・フォント（別オリジン） … cache-first（一度見た近場は圏外でも表示）
//  - ルート探索(OpenRouteService)はPOSTなので対象外＝常に通信（圏外では失敗しアプリ側で理由表示にフォールバック）

const CACHE = "hinan-v9";

// 初回インストール時に確実にキャッシュするアプリ本体
const SHELL = [
  ".",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/auth.js",
  "./js/config.js",
  "./js/map.js",
  "./js/elevation.js",
  "./js/shelters.js",
  "./js/regionstore.js",
  "./js/route.js",
  "./js/chart.js",
  "./data/regions/index.json",
  "./data/regions/13.geojson",
  "./manifest.webmanifest",
  "./icon.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return; // POST(ORS等)は通さない＝通常の通信
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(networkFirst(req));
  } else {
    e.respondWith(cacheFirst(req));
  }
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreVary: true });
    if (hit) return hit;
    if (req.mode === "navigate") {
      const idx = await cache.match("./index.html");
      if (idx) return idx;
    }
    return Response.error();
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req, { ignoreVary: true });
  if (hit) return hit;
  try {
    const res = await fetch(req);
    // 成功レスポンス／opaque(no-cors)なタイルをキャッシュ
    if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return Response.error();
  }
}
