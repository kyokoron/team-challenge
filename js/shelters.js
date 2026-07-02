import {
  SHELTERS_URL,
  WALK_METERS_PER_MIN,
  TSUNAMI_SAFE_ELEVATION,
} from "./config.js";
import { getElevation } from "./elevation.js";

let cachedShelters = null;

// 避難所GeoJSONを読み込む（初回のみfetch）
export async function loadShelters() {
  if (cachedShelters) return cachedShelters;
  const res = await fetch(SHELTERS_URL);
  if (!res.ok) throw new Error(`避難所データの取得に失敗: HTTP ${res.status}`);
  const geojson = await res.json();
  cachedShelters = geojson.features.map((f, i) => ({
    id: i,
    name: f.properties.name,
    kind: f.properties.kind,
    disasters: f.properties.disasters || [],
    capacity: f.properties.capacity ?? null,
    address: f.properties.address || "",
    lon: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  }));
  return cachedShelters;
}

// 2点間の直線距離[m]（Haversine）
export function distanceMeters(lon1, lat1, lon2, lat2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function walkMinutes(meters) {
  return Math.max(1, Math.round(meters / WALK_METERS_PER_MIN));
}

// 現在地・災害種別に応じて避難所をスコアリングし、上位を返す。
// 津波時は標高APIを叩いて高台を優先する。
export async function rankShelters(origin, disasterKey, disasterCfg, limit = 3) {
  const shelters = await loadShelters();

  // 各避難所に距離・徒歩時間・災害対応可否を付与
  const enriched = shelters.map((s) => {
    const dist = distanceMeters(origin.lon, origin.lat, s.lon, s.lat);
    return {
      ...s,
      distance: dist,
      minutes: walkMinutes(dist),
      supportsDisaster: s.disasters.includes(disasterKey),
      elevation: null,
    };
  });

  // 津波の場合のみ標高を取得（並列）
  if (disasterCfg.useElevation) {
    await Promise.all(
      enriched.map(async (s) => {
        s.elevation = await getElevation(s.lon, s.lat);
      })
    );
  }

  // スコア: 小さいほど良い。距離をベースに、対応災害・標高で補正。
  const maxDist = Math.max(...enriched.map((s) => s.distance), 1);
  enriched.forEach((s) => {
    let score = s.distance / maxDist; // 0..1（近いほど小）
    if (!s.supportsDisaster) score += 0.5; // 対応外はペナルティ
    if (disasterCfg.useElevation && s.elevation != null) {
      // 標高が高いほど加点（津波）。10mを基準に -0.4〜0 程度で補正。
      score -= Math.min(0.4, Math.max(0, s.elevation / 100));
      if (s.elevation < TSUNAMI_SAFE_ELEVATION) score += 0.3; // 低地は減点
    }
    s.score = score;
    s.reasons = buildReasons(s, disasterKey, disasterCfg);
  });

  return enriched.sort((a, b) => a.score - b.score).slice(0, limit);
}

// 推奨理由の文言を生成
function buildReasons(s, disasterKey, cfg) {
  const reasons = [];

  reasons.push({ type: "info", text: `徒歩約${s.minutes}分（約${Math.round(s.distance)}m）` });

  if (s.supportsDisaster) {
    reasons.push({ type: "good", text: `${cfg.label}の指定避難先に対応` });
  } else {
    reasons.push({ type: "warn", text: `${cfg.label}への対応は未指定（要確認）` });
  }

  if (cfg.useElevation && s.elevation != null) {
    if (s.elevation >= TSUNAMI_SAFE_ELEVATION) {
      reasons.push({ type: "good", text: `標高 約${s.elevation}m（津波時に有利な高台）` });
    } else {
      reasons.push({ type: "warn", text: `標高 約${s.elevation}m（低地。より高い場所を優先検討）` });
    }
  }

  if (s.capacity) {
    reasons.push({ type: "info", text: `想定収容 約${s.capacity}人` });
  }

  return reasons;
}
