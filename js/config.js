// アプリ全体の設定。タイルURL・災害種別ごとの挙動をここで一元管理する。

// 地理院 標準/淡色地図タイル（ベースマップ）
export const BASE_TILE = "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png";
export const BASE_ATTRIBUTION =
  '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">国土地理院</a>';

// 地理院 標高API（緯度経度 → 標高[m]）
export const ELEVATION_API = "https://cyberjapandata2.gsi.go.jp/general/dem/scripts/getelevation.php";

// OpenRouteService 徒歩ルート（無料キーが必要）
export const ORS_DIRECTIONS = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson";

// 既定のORS APIキー（任意）。
//  - 空文字のままなら、各利用者がUIからキーを入力する（推奨・安全）。
//  - ここに自分のキーを書くと、公開デモで誰でもルート探索が使える。
//    ※Publicリポジトリではキーが公開され不正利用される恐れがあるため、
//      発表当日だけ入れる／使用後に無効化する等の運用を推奨。
export const DEFAULT_ORS_KEY = "";

// 避難所データ。実データ(shelters.geojson)を優先し、無ければサンプルにフォールバック。
// tools/convert-shelters.mjs で国土数値情報から shelters.geojson を生成できる。
export const SHELTERS_URL = "./data/shelters.geojson";
export const SHELTERS_FALLBACK_URL = "./data/shelters.sample.geojson";

// 初期表示位置（実データの対象＝東京都港区周辺）
export const INITIAL_CENTER = [139.7396, 35.6507];
export const INITIAL_ZOOM = 13;

// 徒歩速度（分あたりの距離。不動産表示の慣例 80m/分 を採用）
export const WALK_METERS_PER_MIN = 80;

// 津波時に「高台」とみなす標高のしきい値[m]
export const TSUNAMI_SAFE_ELEVATION = 10;

// 災害種別ごとの設定
//  - hazardTiles: 重ねるハザードマップ(disaportal)のラスタタイル。表示専用。
//  - useElevation: 避難所ランキングで標高を重視するか（津波）。
//  - avoid:        ルート探索で危険ポリゴンの回避を試みるか（洪水）。
export const DISASTERS = {
  earthquake: {
    label: "地震",
    hazardTiles: [],
    legend: null,
    useElevation: false,
    avoid: false,
    note: "地震は面的な浸水・崖崩れの想定区域が単一タイルで提供されていないため、ここでは避難所の距離を重視して提案します（発展: J-SHIS 揺れやすさタイルの重畳）。",
  },
  tsunami: {
    label: "津波",
    hazardTiles: ["https://disaportaldata.gsi.go.jp/raster/04_tsunami_newlegend_data/{z}/{x}/{y}.png"],
    legend: "津波浸水想定（想定最大規模）",
    useElevation: true,
    avoid: false,
    note: "津波は『高台へ逃げる』のが基本。標高が高い避難所を優先して提案します。青系ほど浸水深が大きい想定です。",
  },
  flood: {
    label: "洪水",
    hazardTiles: ["https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png"],
    legend: "洪水浸水想定区域（想定最大規模）",
    useElevation: false,
    avoid: true,
    note: "洪水は浸水想定区域の回避が基本。ルート探索では回避ポリゴン(data/hazard-flood.geojson)があれば避けて経路を引きます。",
  },
  landslide: {
    label: "土砂災害",
    hazardTiles: [
      "https://disaportaldata.gsi.go.jp/raster/05_dosekiryukeikaikuiki/{z}/{x}/{y}.png",
      "https://disaportaldata.gsi.go.jp/raster/05_kyukeishakeikaikuiki/{z}/{x}/{y}.png",
      "https://disaportaldata.gsi.go.jp/raster/05_jisuberikeikaikuiki/{z}/{x}/{y}.png",
    ],
    legend: "土砂災害警戒区域（土石流・急傾斜地・地すべり）",
    useElevation: false,
    avoid: false,
    note: "土砂災害は谷筋・斜面の警戒区域を避けるのが基本。警戒区域（黄・赤）を表示し、区域外の避難所を優先します。",
  },
};

// 洪水ルート回避に使う任意のポリゴンデータ（無ければ通常ルート）
export const FLOOD_AVOID_URL = "./data/hazard-flood.geojson";
