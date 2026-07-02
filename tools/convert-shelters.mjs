#!/usr/bin/env node
/**
 * 国土数値情報「指定緊急避難場所」(P20) などの GeoJSON を、
 * 本アプリの避難所フォーマット (data/shelters.geojson) に変換する。
 *
 * 使い方:
 *   node tools/convert-shelters.mjs <入力.geojson> [出力.geojson] [minLon minLat maxLon maxLat]
 *
 * 例（藤沢・鎌倉あたりの矩形で絞り込み）:
 *   node tools/convert-shelters.mjs P20-21_14.geojson data/shelters.geojson 139.44 35.28 139.56 35.38
 *
 * 出力フォーマット（1 feature の properties）:
 *   { name, kind, disasters: ["earthquake","tsunami","flood","landslide"], capacity, address }
 *
 * 注意: 国土数値情報は年度・都道府県で属性名(P20_xxx)が異なる場合があります。
 *       実行すると最初の1件の生プロパティを表示するので、想定と違えば
 *       下の ATTR / DISASTER_FIELDS を調整してください。
 */
import { readFileSync, writeFileSync } from "fs";

// --- 属性マッピング（候補を順に探索。最初に見つかったキーを採用）-------------
const ATTR = {
  name: ["P20_002", "施設・場所名", "名称", "name"],
  address: ["P20_003", "住所", "所在地", "address"],
};

// 本アプリの災害キー → 国土数値情報側の候補属性名
// 値が「1」「○」「該当」「true」などのとき、その災害に対応と判定する。
const DISASTER_FIELDS = {
  flood: ["P20_004", "P20_005", "洪水"],
  landslide: ["P20_005", "P20_006", "崖崩れ、土石流及び地滑り", "土砂災害"],
  tsunami: ["P20_008", "P20_009", "津波"],
  earthquake: ["P20_007", "P20_008", "地震"],
};
// -----------------------------------------------------------------------------

const TRUTHY = new Set(["1", "○", "◯", "該当", "true", "TRUE", "有"]);

function pick(props, candidates) {
  for (const key of candidates) {
    if (props[key] != null && String(props[key]).trim() !== "") return props[key];
  }
  return null;
}

function isDesignated(props, candidates) {
  for (const key of candidates) {
    if (key in props) {
      const v = String(props[key]).trim();
      if (TRUTHY.has(v)) return true;
    }
  }
  return false;
}

function main() {
  const [input, output = "data/shelters.geojson", ...bbox] = process.argv.slice(2);
  if (!input) {
    console.error("使い方: node tools/convert-shelters.mjs <入力.geojson> [出力.geojson] [minLon minLat maxLon maxLat]");
    process.exit(1);
  }

  const src = JSON.parse(readFileSync(input, "utf8"));
  const features = src.features || [];
  if (features.length === 0) {
    console.error("features が見つかりません。GeoJSON か確認してください。");
    process.exit(1);
  }

  console.log("▼ 最初の1件の生プロパティ（属性名の確認用）:");
  console.log(JSON.stringify(features[0].properties, null, 2), "\n");

  let box = null;
  if (bbox.length === 4) {
    const [a, b, c, d] = bbox.map(Number);
    box = { minLon: a, minLat: b, maxLon: c, maxLat: d };
    console.log("絞り込み矩形:", box, "\n");
  }

  const out = [];
  for (const f of features) {
    const g = f.geometry;
    if (!g || g.type !== "Point") continue; // 避難所は点データ想定
    const [lon, lat] = g.coordinates;
    if (box && (lon < box.minLon || lon > box.maxLon || lat < box.minLat || lat > box.maxLat)) continue;

    const props = f.properties || {};
    const disasters = Object.entries(DISASTER_FIELDS)
      .filter(([, cands]) => isDesignated(props, cands))
      .map(([key]) => key);

    out.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lon, lat] },
      properties: {
        name: pick(props, ATTR.name) || "（名称不明）",
        kind: "指定緊急避難場所",
        disasters,
        capacity: null,
        address: pick(props, ATTR.address) || "",
      },
    });
  }

  const result = {
    type: "FeatureCollection",
    note: `国土数値情報から変換 (${new Date().toISOString().slice(0, 10)})`,
    features: out,
  };
  writeFileSync(output, JSON.stringify(result, null, 1));

  const withDisaster = out.filter((f) => f.properties.disasters.length > 0).length;
  console.log(`✅ ${out.length} 件を書き出しました → ${output}`);
  console.log(`   うち災害種別が1つ以上付与された件数: ${withDisaster}`);
  if (withDisaster === 0) {
    console.warn("⚠ 災害フラグが1件も付きませんでした。上の生プロパティを見て DISASTER_FIELDS を調整してください。");
  }
}

main();
