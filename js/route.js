import { ORS_DIRECTIONS, FLOOD_AVOID_URL, DEFAULT_ORS_KEY } from "./config.js";

const KEY_STORAGE = "ors_api_key";

// UIで保存したキーを優先し、無ければ config の既定キーにフォールバック
export function getApiKey() {
  return localStorage.getItem(KEY_STORAGE) || DEFAULT_ORS_KEY || "";
}
export function setApiKey(key) {
  localStorage.setItem(KEY_STORAGE, key.trim());
}
export function hasApiKey() {
  return getApiKey().length > 0;
}

// ---- 洪水回避ポリゴン（任意・data/hazard-flood.geojson があれば有効） ----
let floodCache;
async function loadFloodPolys() {
  if (floodCache !== undefined) return floodCache;
  try {
    const res = await fetch(FLOOD_AVOID_URL);
    if (!res.ok) {
      floodCache = null;
      return null;
    }
    const geojson = await res.json();
    const polys = [];
    for (const f of geojson.features || []) {
      const g = f.geometry;
      if (!g) continue;
      const list = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
      for (const rings of list) polys.push({ coordinates: rings, bbox: ringBbox(rings[0]), verts: vertexCount(rings) });
    }
    floodCache = polys.length ? polys : null;
  } catch {
    floodCache = null;
  }
  return floodCache;
}

function ringBbox(ring) {
  let a = 180, b = 90, c = -180, d = -90;
  for (const [x, y] of ring) {
    if (x < a) a = x;
    if (y < b) b = y;
    if (x > c) c = x;
    if (y > d) d = y;
  }
  return [a, b, c, d];
}
function vertexCount(rings) {
  return rings.reduce((n, r) => n + r.length, 0);
}
function bboxIntersect(a, b) {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

// ルートの起終点を含む矩形をpad[度]だけ広げる
function routeBbox(start, end, pad) {
  return [
    Math.min(start.lon, end.lon) - pad,
    Math.min(start.lat, end.lat) - pad,
    Math.max(start.lon, end.lon) + pad,
    Math.max(start.lat, end.lat) + pad,
  ];
}

// ルート周辺の浸水ポリゴンだけを選ぶ（ORSの制限に収まるよう頂点数・数を上限）
function selectNearbyPolys(polys, start, end) {
  const box = routeBbox(start, end, 0.02); // 約2km外側まで
  const near = polys.filter((p) => bboxIntersect(p.bbox, box));
  const cx = (start.lon + end.lon) / 2;
  const cy = (start.lat + end.lat) / 2;
  near.sort((p, q) => bboxDist(p.bbox, cx, cy) - bboxDist(q.bbox, cx, cy));
  const chosen = [];
  let verts = 0;
  for (const p of near) {
    if (chosen.length >= 80 || verts + p.verts > 3000) break;
    chosen.push(p);
    verts += p.verts;
  }
  return chosen;
}
function bboxDist(bb, x, y) {
  const dx = Math.max(bb[0] - x, 0, x - bb[2]);
  const dy = Math.max(bb[1] - y, 0, y - bb[3]);
  return dx * dx + dy * dy;
}

// OpenRouteServiceで徒歩ルートを取得。
//  avoid=true かつ回避データがあれば、ルート周辺の浸水域を avoid_polygons で回避。
// 戻り値: { geometry, distance, duration, avoided, avoidFailed }
//  例外: "NO_KEY" / "NO_SAFE_ROUTE"(回避で経路が引けない=垂直避難検討) / その他
export async function getRoute(start, end, { avoid = false, _noAvoid = false } = {}) {
  const key = getApiKey();
  if (!key) throw new Error("NO_KEY");

  const body = { coordinates: [[start.lon, start.lat], [end.lon, end.lat]] };

  let avoided = false;
  if (avoid && !_noAvoid) {
    const polys = await loadFloodPolys();
    if (polys) {
      const chosen = selectNearbyPolys(polys, start, end);
      if (chosen.length) {
        body.options = { avoid_polygons: { type: "MultiPolygon", coordinates: chosen.map((p) => p.coordinates) } };
        avoided = true;
      }
    }
  }

  const res = await fetch(ORS_DIRECTIONS, {
    method: "POST",
    headers: { Authorization: key, "Content-Type": "application/json", Accept: "application/geo+json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    if (avoided) {
      let code = null;
      try {
        code = JSON.parse(detail)?.error?.code;
      } catch {}
      // 2010: 起終点が回避域内 / 2099: 経路なし → 本当に囲まれている＝垂直避難を促す
      if (code === 2010 || code === 2099) throw new Error("NO_SAFE_ROUTE");
      // それ以外（回避域が大きすぎる等の技術的失敗）→ 回避なしで再試行し、失敗を明示
      const r = await getRoute(start, end, { avoid: true, _noAvoid: true });
      return { ...r, avoided: false, avoidFailed: true };
    }
    throw new Error(`ORS ${res.status}: ${detail.slice(0, 200)}`);
  }

  const geojson = await res.json();
  const feature = geojson.features && geojson.features[0];
  if (!feature) throw new Error("ルートが見つかりませんでした");
  const summary = feature.properties.summary || {};
  return {
    geometry: feature.geometry,
    distance: summary.distance ?? null,
    duration: summary.duration ?? null,
    avoided,
    avoidFailed: false,
  };
}
