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

// 洪水回避ポリゴン（任意）。存在しなければ null。
let avoidCache;
async function loadFloodAvoid() {
  if (avoidCache !== undefined) return avoidCache;
  try {
    const res = await fetch(FLOOD_AVOID_URL);
    if (!res.ok) {
      avoidCache = null;
      return null;
    }
    const geojson = await res.json();
    avoidCache = toMultiPolygon(geojson);
  } catch {
    avoidCache = null;
  }
  return avoidCache;
}

// FeatureCollection(Polygon群) を1つのMultiPolygon geometryにまとめる
function toMultiPolygon(geojson) {
  const polys = [];
  for (const f of geojson.features || []) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === "Polygon") polys.push(g.coordinates);
    else if (g.type === "MultiPolygon") polys.push(...g.coordinates);
  }
  if (polys.length === 0) return null;
  return { type: "MultiPolygon", coordinates: polys };
}

// OpenRouteServiceで徒歩ルートを取得。
// avoid=true かつ回避ポリゴンがあれば avoid_polygons を付与する。
// 戻り値: { geometry, distance, duration, avoided } / 例外時は throw。
export async function getRoute(start, end, { avoid = false } = {}) {
  const key = getApiKey();
  if (!key) throw new Error("NO_KEY");

  const body = {
    coordinates: [
      [start.lon, start.lat],
      [end.lon, end.lat],
    ],
  };

  let avoided = false;
  if (avoid) {
    const poly = await loadFloodAvoid();
    if (poly) {
      body.options = { avoid_polygons: poly };
      avoided = true;
    }
  }

  const res = await fetch(ORS_DIRECTIONS, {
    method: "POST",
    headers: {
      Authorization: key,
      "Content-Type": "application/json",
      Accept: "application/geo+json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ORS ${res.status}: ${detail.slice(0, 200)}`);
  }

  const geojson = await res.json();
  const feature = geojson.features && geojson.features[0];
  if (!feature) throw new Error("ルートが見つかりませんでした");

  const summary = feature.properties.summary || {};
  return {
    geometry: feature.geometry,
    distance: summary.distance ?? null, // m
    duration: summary.duration ?? null, // s
    avoided,
  };
}
