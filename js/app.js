import { DISASTERS } from "./config.js";
import { loadShelters, rankShelters } from "./shelters.js";
import {
  initMap,
  setHazardLayers,
  setCurrentLocation,
  setShelterMarkers,
  drawRoute,
  clearRoute,
  fitToRoute,
  onMapClick,
  resizeMap,
} from "./map.js";
import { getRoute, getApiKey, setApiKey, hasApiKey } from "./route.js";
import { renderHazardChart } from "./chart.js";

const state = {
  disaster: "earthquake",
  origin: null, // {lon, lat}
  ranked: [],
  selectedId: null,
  counts: null, // {disasterKey: 対応施設数}
  total: 0,
};

// DOM
const $ = (sel) => document.querySelector(sel);
const disasterButtons = document.querySelectorAll(".disaster-btn");
const hazardNote = $("#hazard-note");
const locateBtn = $("#locate-btn");
const pickBtn = $("#pick-btn");
const mapWrap = $("#map-wrap");
const panel = $("#panel");
const resizer = $("#resizer");
const locationStatus = $("#location-status");
const shelterList = $("#shelter-list");
const shelterCount = $("#shelter-count");
const legend = $("#legend");
const hazardChart = $("#hazard-chart");
const statsTotal = $("#stats-total");
const orsKeyInput = $("#ors-key");
const saveKeyBtn = $("#save-key-btn");
const keyStatus = $("#key-status");

export async function startApp() {
  await initMap();
  applyDisaster("earthquake");

  // 避難所を読み込み、災害種別ごとの対応状況を集計してグラフ表示
  const shelters = await loadShelters().catch((e) => {
    alert(e.message);
    return [];
  });
  computeCounts(shelters);
  renderChart();

  // 位置情報が使えない/拒否された環境向け: 地図クリックで現在地を指定
  onMapClick((lon, lat) => {
    if (!clickToSetEnabled) return;
    setOrigin(lon, lat, "地図で指定した地点");
  });

  disasterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      disasterButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      applyDisaster(btn.dataset.disaster);
    });
  });

  locateBtn.addEventListener("click", requestLocation);

  // 場所を手動指定（現在地が使えない/オフラインでも任意地点を設定）
  pickBtn.addEventListener("click", () => {
    clickToSetEnabled = !clickToSetEnabled;
    pickBtn.classList.toggle("is-active", clickToSetEnabled);
    mapWrap.classList.toggle("picking", clickToSetEnabled);
    if (clickToSetEnabled) locationStatus.textContent = "地図上の任意の地点をクリックしてください";
  });

  setupResizer();

  // ルート探索キー
  if (hasApiKey()) {
    orsKeyInput.value = getApiKey();
    keyStatus.textContent = "APIキーは設定済みです。";
  }
  saveKeyBtn.addEventListener("click", () => {
    setApiKey(orsKeyInput.value);
    keyStatus.textContent = hasApiKey() ? "保存しました。" : "キーが空です。";
  });
}

function computeCounts(shelters) {
  const counts = { earthquake: 0, tsunami: 0, typhoon: 0, flood: 0, landslide: 0 };
  for (const s of shelters) {
    for (const d of s.disasters) {
      if (d in counts) counts[d] += 1;
    }
  }
  state.counts = counts;
  state.total = shelters.length;
}

function renderChart() {
  if (!state.counts) return;
  statsTotal.textContent = `全${state.total}施設`;
  renderHazardChart(hazardChart, state.counts, state.total, state.disaster);
}

function applyDisaster(key) {
  state.disaster = key;
  const cfg = DISASTERS[key];
  setHazardLayers(cfg.hazardTiles);
  hazardNote.textContent = cfg.note;
  renderChart();

  if (cfg.legend) {
    legend.classList.remove("hidden");
    legend.innerHTML = `<h4>表示中のハザード</h4>${cfg.legend}<br><span style="color:#94a3b8">出典: 重ねるハザードマップ(国土地理院)</span>`;
  } else {
    legend.classList.add("hidden");
  }

  clearRoute();
  if (state.origin) updateRecommendations();
}

function requestLocation() {
  if (!navigator.geolocation) {
    locationStatus.textContent = "この端末では位置情報を利用できません。";
    return;
  }
  locationStatus.textContent = "現在地を取得中…";
  navigator.geolocation.getCurrentPosition(
    (pos) => setOrigin(pos.coords.longitude, pos.coords.latitude, "現在地"),
    (err) => {
      clickToSetEnabled = true;
      locationStatus.textContent = `取得失敗: ${err.message}。地図をクリックして現在地を指定できます。`;
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// 位置情報が使えない環境では地図クリックで現在地を指定できるようにする
let clickToSetEnabled = false;

function setOrigin(lon, lat, label) {
  state.origin = { lon, lat };
  locationStatus.textContent = `${label}: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  setCurrentLocation(lon, lat);
  // 場所指定モードは1回で解除
  if (clickToSetEnabled) {
    clickToSetEnabled = false;
    pickBtn.classList.remove("is-active");
    mapWrap.classList.remove("picking");
  }
  updateRecommendations();
}

// パネルと地図の境目をドラッグして幅を変更する
function setupResizer() {
  const KEY = "panel_width";
  const saved = Number(localStorage.getItem(KEY));
  if (saved) panel.style.width = `${saved}px`;

  let dragging = false;
  const onMove = (clientX) => {
    if (!dragging) return;
    const left = panel.getBoundingClientRect().left;
    const w = Math.min(Math.max(clientX - left, 280), Math.min(720, window.innerWidth * 0.7));
    panel.style.width = `${w}px`;
    resizeMap();
  };
  resizer.addEventListener("pointerdown", (e) => {
    dragging = true;
    resizer.setPointerCapture(e.pointerId);
    document.body.style.userSelect = "none";
  });
  resizer.addEventListener("pointermove", (e) => onMove(e.clientX));
  resizer.addEventListener("pointerup", (e) => {
    dragging = false;
    document.body.style.userSelect = "";
    localStorage.setItem(KEY, String(Math.round(panel.getBoundingClientRect().width)));
    resizeMap();
  });
}

async function updateRecommendations() {
  if (!state.origin) return;
  const cfg = DISASTERS[state.disaster];
  shelterList.innerHTML = `<li class="empty">避難所を評価中…</li>`;

  const all = await loadShelters();
  const ranked = await rankShelters(state.origin, state.disaster, cfg, 5);
  state.ranked = ranked;

  const topIds = ranked.map((s) => s.id);
  setShelterMarkers(all, topIds, (s) => selectShelter(s.id));
  renderShelterList(ranked);
  shelterCount.textContent = `${ranked.length}件`;

  // 最上位へのルートを自動描画（キーがあれば）
  if (ranked.length) selectShelter(ranked[0].id);
}

function renderShelterList(ranked) {
  if (!ranked.length) {
    shelterList.innerHTML = `<li class="empty">該当する避難所がありません。</li>`;
    return;
  }
  shelterList.innerHTML = "";
  ranked.forEach((s, i) => {
    const li = document.createElement("li");
    li.className = "shelter-card" + (s.id === state.selectedId ? " is-selected" : "");
    li.dataset.id = s.id;
    li.innerHTML = `
      <div class="name"><span>${s.name}</span><span class="rank">第${i + 1}候補</span></div>
      <ul class="reasons">
        ${s.reasons.map((r) => `<li class="${r.type === "good" ? "good" : r.type === "warn" ? "warn" : ""}">${iconFor(r.type)} ${r.text}</li>`).join("")}
      </ul>`;
    li.addEventListener("click", () => selectShelter(s.id));
    shelterList.appendChild(li);
  });
}

function iconFor(type) {
  return type === "good" ? "✅" : type === "warn" ? "⚠️" : "•";
}

async function selectShelter(id) {
  state.selectedId = id;
  const shelter = state.ranked.find((s) => s.id === id);
  if (!shelter) return;

  // リストの選択状態を更新
  document.querySelectorAll(".shelter-card").forEach((c) => {
    c.classList.toggle("is-selected", Number(c.dataset.id) === id);
  });

  const cfg = DISASTERS[state.disaster];
  if (!hasApiKey()) {
    appendRouteHint(shelter, "APIキー未設定のためルート線は描画されません（避難所の場所は地図に表示中）。");
    return;
  }

  try {
    const route = await getRoute(state.origin, shelter, { avoid: cfg.avoid });
    drawRoute(route.geometry);
    fitToRoute(route.geometry);
    const min = route.duration ? Math.round(route.duration / 60) : shelter.minutes;
    const km = route.distance ? (route.distance / 1000).toFixed(2) : null;
    let msg = `実ルート: 徒歩約${min}分` + (km ? `（${km}km）` : "");
    if (route.avoided) msg += " / 浸水想定区域を回避";
    appendRouteHint(shelter, msg, route.avoided ? "good" : "info");
  } catch (e) {
    const m = e.message === "NO_KEY" ? "APIキー未設定です。" : `ルート取得失敗: ${e.message}`;
    appendRouteHint(shelter, m, "warn");
  }
}

// 選択中カードの末尾にルート情報を追記
function appendRouteHint(shelter, text, type = "info") {
  const card = document.querySelector(`.shelter-card[data-id="${shelter.id}"]`);
  if (!card) return;
  let hint = card.querySelector(".route-hint");
  if (!hint) {
    hint = document.createElement("div");
    hint.className = "route-hint";
    hint.style.cssText = "margin-top:12px;font-size:12.5px;padding-top:12px;border-top:1px dashed #e6eaee;font-weight:500;";
    card.appendChild(hint);
  }
  hint.style.color = type === "good" ? "#2f8f5b" : type === "warn" ? "#c2410c" : "#55636e";
  hint.textContent = "🧭 " + text;
}

// 起動は認証(js/auth.js)が成功したときに startApp() が呼ばれる。
