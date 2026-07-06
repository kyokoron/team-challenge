#!/usr/bin/env node
/**
 * 国土数値情報「洪水浸水想定区域」(A31 など) の GeoJSON を、
 * ルート回避用の軽量ポリゴン `data/hazard-flood.geojson` に変換する。
 *  - 属性は落とし、ジオメトリ(Polygon/MultiPolygon)だけを残す
 *  - 頂点を間引き（Douglas-Peucker）してORSの avoid_polygons 制限に収まりやすくする
 *  - 任意で矩形クリップ（発表エリアだけに絞る）
 *
 * 使い方:
 *   node tools/convert-flood.mjs <入力.geojson> [出力=data/hazard-flood.geojson] [簡略化m=15] [minLon minLat maxLon maxLat]
 *
 * 例（東京都心付近だけ・15m簡略化）:
 *   node tools/convert-flood.mjs A31-12_13.geojson data/hazard-flood.geojson 15 139.68 35.62 139.80 35.72
 *
 * 注意: ORSの avoid_polygons は面積・頂点数に上限があります。まずは狭い範囲＋強めの簡略化を推奨。
 *       アプリ側(route.js)もルート周辺のポリゴンだけを送るよう制限しています。
 */
import { readFileSync, writeFileSync } from "fs";

function perpDist(p, a, b) {
  const [x, y] = p, [x1, y1] = a, [x2, y2] = b;
  const dx = x2 - x1, dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  const cx = x1 + t * dx, cy = y1 + t * dy;
  return Math.hypot(x - cx, y - cy);
}
function dp(points, tol) {
  if (points.length < 3) return points;
  let maxd = 0, idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], points[0], points[points.length - 1]);
    if (d > maxd) { maxd = d; idx = i; }
  }
  if (maxd > tol) {
    const left = dp(points.slice(0, idx + 1), tol);
    const right = dp(points.slice(idx), tol);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}
function simplifyRing(ring, tol) {
  if (ring.length <= 5) return ring;
  const open = ring.slice(0, -1);
  let s = dp(open, tol);
  if (s.length < 3) return ring; // 潰れすぎたら元のまま
  s = s.concat([s[0]]); // 閉じる
  return s;
}
function simplifyPolygon(rings, tol) {
  return rings.map((r) => simplifyRing(r, tol)).filter((r) => r.length >= 4);
}
function ringBbox(ring) {
  let a = 180, b = 90, c = -180, d = -90;
  for (const [x, y] of ring) { if (x < a) a = x; if (y < b) b = y; if (x > c) c = x; if (y > d) d = y; }
  return [a, b, c, d];
}
function bboxIntersect(a, b) {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

function main() {
  const [input, output = "data/hazard-flood.geojson", tolM = "15", ...bbox] = process.argv.slice(2);
  if (!input) {
    console.error("使い方: node tools/convert-flood.mjs <入力.geojson> [出力] [簡略化m] [minLon minLat maxLon maxLat]");
    process.exit(1);
  }
  const tol = Number(tolM) / 111000; // m → 度（概算）
  let box = null;
  if (bbox.length === 4) box = bbox.map(Number);

  const src = JSON.parse(readFileSync(input, "utf8"));
  const out = [];
  let vin = 0, vout = 0;
  for (const f of src.features || []) {
    const g = f.geometry;
    if (!g) continue;
    const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
    for (const rings of polys) {
      if (box && !bboxIntersect(ringBbox(rings[0]), box)) continue;
      vin += rings.reduce((n, r) => n + r.length, 0);
      const simp = simplifyPolygon(rings, tol);
      if (!simp.length) continue;
      vout += simp.reduce((n, r) => n + r.length, 0);
      out.push({ type: "Feature", geometry: { type: "Polygon", coordinates: simp }, properties: {} });
    }
  }

  const fc = { type: "FeatureCollection", note: `洪水浸水想定区域を簡略化 (${new Date().toISOString().slice(0, 10)})`, features: out };
  writeFileSync(output, JSON.stringify(fc));
  console.log(`✅ ${out.length} ポリゴンを書き出し → ${output}`);
  console.log(`   頂点数 ${vin} → ${vout}（簡略化 ${tolM}m）`);
  if (out.length > 200) console.warn("⚠ ポリゴンが多めです。範囲を絞るか簡略化mを大きくすると、ORSでの回避が安定します。");
}

main();
