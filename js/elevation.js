import { ELEVATION_API } from "./config.js";

// 地理院 標高APIで標高[m]を取得。取得不能時は null。
// 結果は座標キーでキャッシュし、同一地点への重複リクエストを避ける。
const cache = new Map();

export async function getElevation(lon, lat) {
  const key = `${lon.toFixed(5)},${lat.toFixed(5)}`;
  if (cache.has(key)) return cache.get(key);

  try {
    const url = `${ELEVATION_API}?lon=${lon}&lat=${lat}&outtype=JSON`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // elevation は数値、または "-----"（データ無し）で返る
    const value = typeof data.elevation === "number" ? data.elevation : null;
    cache.set(key, value);
    return value;
  } catch (e) {
    console.warn("標高取得に失敗:", e);
    cache.set(key, null);
    return null;
  }
}
