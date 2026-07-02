import {
  BASE_TILE,
  BASE_ATTRIBUTION,
  INITIAL_CENTER,
  INITIAL_ZOOM,
} from "./config.js";

let map;
let hazardLayerIds = [];
let shelterMarkers = [];
let currentMarker = null;

export function initMap() {
  // 空スタイルで初期化する。空スタイルの 'load' はタイルの成否に関わらず必ず発火するため、
  // オフラインで基盤タイルが1枚も無い場合でもアプリ(パネル/避難所/グラフ)が確実に起動する。
  // ベース地図(地理院タイル)は 'load' 後にレイヤとして追加する。
  map = new maplibregl.Map({
    container: "map",
    center: INITIAL_CENTER,
    zoom: INITIAL_ZOOM,
    style: { version: 8, sources: {}, layers: [] },
  });
  map.addControl(new maplibregl.NavigationControl(), "top-right");
  map.addControl(new maplibregl.ScaleControl({ unit: "metric" }));
  return new Promise((resolve) => {
    map.once("load", () => {
      map.addSource("base", {
        type: "raster",
        tiles: [BASE_TILE],
        tileSize: 256,
        attribution: BASE_ATTRIBUTION,
      });
      map.addLayer({ id: "base", type: "raster", source: "base" });
      resolve(map);
    });
  });
}

// ハザードタイルを差し替える（半透明でベースに重畳）
export function setHazardLayers(tileUrls) {
  // 既存ハザードを除去
  for (const id of hazardLayerIds) {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  }
  hazardLayerIds = [];

  tileUrls.forEach((url, i) => {
    const id = `hazard-${i}`;
    map.addSource(id, { type: "raster", tiles: [url], tileSize: 256 });
    // ルート・避難所の下、ベースの上に入れる
    const before = map.getLayer("route-line") ? "route-line" : undefined;
    map.addLayer({ id, type: "raster", source: id, paint: { "raster-opacity": 0.6 } }, before);
    hazardLayerIds.push(id);
  });
}

export function setCurrentLocation(lon, lat) {
  if (currentMarker) currentMarker.remove();
  const el = document.createElement("div");
  el.style.cssText =
    "width:18px;height:18px;border-radius:50%;background:#157a8c;border:3px solid #fff;box-shadow:0 0 0 4px rgba(21,122,140,.28)";
  currentMarker = new maplibregl.Marker({ element: el })
    .setLngLat([lon, lat])
    .setPopup(new maplibregl.Popup({ offset: 16 }).setHTML("<strong>現在地</strong>"))
    .addTo(map);
  map.flyTo({ center: [lon, lat], zoom: 14 });
}

// 避難所マーカーを描画。上位はランク番号付きの強調マーカー。
export function setShelterMarkers(shelters, topIds, onClick) {
  shelterMarkers.forEach((m) => m.remove());
  shelterMarkers = [];

  shelters.forEach((s) => {
    const rank = topIds.indexOf(s.id);
    const isTop = rank >= 0;
    const el = document.createElement("div");
    el.style.cssText = `
      width:${isTop ? 26 : 18}px;height:${isTop ? 26 : 18}px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);cursor:pointer;
      background:${isTop ? "#157a8c" : "#9aa7b1"};border:2px solid #fff;
      display:flex;align-items:center;justify-content:center;`;
    if (isTop) {
      const num = document.createElement("span");
      num.textContent = String(rank + 1);
      num.style.cssText = "transform:rotate(45deg);color:#fff;font-size:12px;font-weight:700;";
      el.appendChild(num);
    }
    const popup = new maplibregl.Popup({ offset: 20 }).setHTML(
      `<strong>${s.name}</strong><br>${s.kind || ""}<br>徒歩約${s.minutes}分` +
        (s.elevation != null ? `<br>標高 約${s.elevation}m` : "")
    );
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([s.lon, s.lat])
      .setPopup(popup)
      .addTo(map);
    el.addEventListener("click", () => onClick && onClick(s));
    shelterMarkers.push(marker);
  });
}

// ルート線を描画/更新
export function drawRoute(geometry) {
  const data = { type: "Feature", geometry, properties: {} };
  if (map.getSource("route")) {
    map.getSource("route").setData(data);
  } else {
    map.addSource("route", { type: "geojson", data });
    map.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#f97316", "line-width": 5, "line-opacity": 0.9 },
    });
  }
}

export function clearRoute() {
  if (map.getLayer("route-line")) map.removeLayer("route-line");
  if (map.getSource("route")) map.removeSource("route");
}

// 地図クリック時のコールバック登録（位置情報が使えない環境の代替入力）
export function onMapClick(cb) {
  map.on("click", (e) => cb(e.lngLat.lng, e.lngLat.lat));
}

export function fitToRoute(geometry) {
  const coords = geometry.coordinates;
  const bounds = coords.reduce(
    (b, c) => b.extend(c),
    new maplibregl.LngLatBounds(coords[0], coords[0])
  );
  map.fitBounds(bounds, { padding: 80, maxZoom: 16 });
}
