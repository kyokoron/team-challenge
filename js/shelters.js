import { TSUNAMI_SAFE_ELEVATION } from "./config.js";
import { getElevation } from "./elevation.js";

// 距離が広域データでも「近い順」を保証するため、まず最寄りK件に絞ってから評価する
const NEAREST_K = 50;

// GeoJSONのfeature配列を避難所オブジェクトに変換する。
// データの取得元（地域ファイル/IndexedDB）は呼び出し側が用意する。
export function makeShelters(features) {
  return features.map((f, i) => ({
    id: i,
    name: f.properties.name,
    kind: f.properties.kind,
    disasters: f.properties.disasters || [],
    capacity: f.properties.capacity ?? null,
    address: f.properties.address || "",
    lon: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  }));
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

// 現在地・災害種別に応じて避難所をスコアリングし、上位を返す。
// 安全方針：
//  - その災害に「指定された」避難所のみを候補にする（無指定を勧めない）
//  - まず最寄りK件に絞り、必ず"近い順"を保証してから評価する
//  - 津波・高潮は標高で高台を優先。標高が取れないときは安全と断定しない。
export async function rankShelters(origin, disasterKey, disasterCfg, limit, shelters) {
  let pool = shelters.map((s) => ({
    ...s,
    distance: distanceMeters(origin.lon, origin.lat, s.lon, s.lat),
    supportsDisaster: s.disasters.includes(disasterKey),
    elevation: null,
  }));

  // この災害に指定された避難所だけを候補に（命に関わるため）。
  // 万一その地域に指定が皆無なら、警告付きで全件から出す（黙って隠さない）。
  const designated = pool.filter((s) => s.supportsDisaster);
  const fellBack = designated.length === 0;
  pool = fellBack ? pool : designated;

  // 最寄りK件に絞る（広域データでも近い順を担保）
  pool.sort((a, b) => a.distance - b.distance);
  pool = pool.slice(0, NEAREST_K);

  // 津波・高潮のみ、近傍K件だけ標高を取得
  if (disasterCfg.useElevation) {
    await Promise.all(pool.map(async (s) => (s.elevation = await getElevation(s.lon, s.lat))));
  }

  // スコアは「徒歩距離[m]換算」。小さいほど良い。標高で高台を優先。
  pool.forEach((s) => {
    let score = s.distance;
    if (disasterCfg.useElevation && s.elevation != null) {
      score -= Math.min(s.elevation, 30) * 30; // 高いほど優先（距離換算）
      if (s.elevation < TSUNAMI_SAFE_ELEVATION) score += 1500; // 低地は大幅減点
    }
    s.score = score;
    s.reasons = buildReasons(s, disasterKey, disasterCfg);
  });

  return pool.sort((a, b) => a.score - b.score).slice(0, limit);
}

// 推奨理由の文言を生成（アイコンは表示側で付与）
function buildReasons(s, disasterKey, cfg) {
  const reasons = [];

  // 直線距離であることを明示（徒歩時間は実ルートで別途表示）
  reasons.push({ type: "info", text: `直線 約${Math.round(s.distance)}m（実際の道のりは異なります）` });

  if (s.supportsDisaster) {
    reasons.push({ type: "good", text: `${cfg.label}の指定避難場所` });
  } else {
    reasons.push({ type: "warn", text: `${cfg.label}の指定ではありません。安全か自治体情報で必ず確認を` });
  }

  if (cfg.useElevation) {
    if (s.elevation == null) {
      reasons.push({ type: "warn", text: "標高を取得できませんでした。高台かどうか現地で確認を" });
    } else if (s.elevation >= TSUNAMI_SAFE_ELEVATION) {
      reasons.push({ type: "good", text: `標高 約${s.elevation}m（高台）` });
    } else {
      reasons.push({ type: "warn", text: `標高 約${s.elevation}m（低地。より高い場所を優先）` });
    }
  }

  if (s.capacity) {
    reasons.push({ type: "info", text: `想定収容 約${s.capacity}人` });
  }

  return reasons;
}
