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

// 避難所データは data/regions/ 配下の地域ファイル（js/regionstore.js が管理）。
// 誤案内防止のため、サンプル(架空)データへのフォールバックは廃止済み。

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
    // localRangeKm: 最寄り指定避難所がこれより遠ければ「対象区域外の可能性」と警告する
    localRangeKm: null, // 地震は避難所が密なので距離チェックなし
    note: "地震は面的な浸水・崖崩れの想定区域が単一タイルで提供されていないため、ここでは避難所の距離を重視して提案します（発展: J-SHIS 揺れやすさタイルの重畳）。",
  },
  tsunami: {
    label: "津波",
    hazardTiles: ["https://disaportaldata.gsi.go.jp/raster/04_tsunami_newlegend_data/{z}/{x}/{y}.png"],
    legend: "津波浸水想定（想定最大規模）",
    useElevation: true,
    avoid: false,
    localRangeKm: 2.5,
    // 内陸など対象外の地点で「海側へ誘導」しないための注意文
    advisory:
      "この地点付近に津波の指定避難場所がありません。内陸で津波浸水の対象外の可能性が高い地点です。津波警報時も無理に沿岸へ向かわず、その場で近くの高い建物の上階（垂直避難）や高台へ避難してください。",
    note: "津波は『高台へ逃げる』のが基本。標高が高い避難所を優先して提案します。青系ほど浸水深が大きい想定です。",
  },
  typhoon: {
    label: "台風・高潮",
    hazardTiles: [
      "https://disaportaldata.gsi.go.jp/raster/03_hightide_l2_shinsuishin_data/{z}/{x}/{y}.png",
      "https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png",
    ],
    legend: "高潮浸水想定／洪水浸水想定（想定最大規模）",
    useElevation: true,
    avoid: true,
    localRangeKm: 3,
    note: "台風は高潮・浸水・強風の複合。高潮／浸水想定を重ねて表示し、標高が高い避難所を優先します。",
  },
  flood: {
    label: "洪水",
    hazardTiles: ["https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png"],
    legend: "洪水浸水想定区域（想定最大規模）",
    useElevation: false,
    avoid: true,
    localRangeKm: 3,
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
    localRangeKm: 3,
    note: "土砂災害は谷筋・斜面の警戒区域を避けるのが基本。警戒区域（黄・赤）を表示し、区域外の避難所を優先します。",
  },
};

// 洪水ルート回避に使う任意のポリゴンデータ（無ければ通常ルート）
export const FLOOD_AVOID_URL = "./data/hazard-flood.geojson";

// Auth0 (OIDC) の設定。
//  - ここに書けば全利用者に適用。空ならログイン画面で入力（localStorageに保存）。
//  - どちらも公開値なので commit しても問題ない（Client Secret は使わない=PKCE）。
export const AUTH0_DOMAIN = "dev-evacuation-simulator.jp.auth0.com";
export const AUTH0_CLIENT_ID = "4rFMwPdLLfh3i5wwepryyPY32dasSKVx";
