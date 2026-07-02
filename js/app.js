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
} from "./map.js";
import { getRoute, getApiKey, setApiKey, hasApiKey } from "./route.js";

const state = {
  disaster: "earthquake",
  origin: null, // {lon, lat}
  ranked: [],
  selectedId: null,
};

// DOM
const $ = (sel) => document.querySelector(sel);
const disasterButtons = document.querySelectorAll(".disaster-btn");
const hazardNote = $("#hazard-note");
const locateBtn = $("#locate-btn");
const locationStatus = $("#location-status");
const shelterList = $("#shelter-list");
const shelterCount = $("#shelter-count");
const legend = $("#legend");
const orsKeyInput = $("#ors-key");
const saveKeyBtn = $("#save-key-btn");
const keyStatus = $("#key-status");

async function boot() {
  await initMap();
  applyDisaster("earthquake");
  await loadShelters().catch((e) => alert(e.message));

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

function applyDisaster(key) {
  state.disaster = key;
  const cfg = DISASTERS[key];
  setHazardLayers(cfg.hazardTiles);
  hazardNote.textContent = cfg.note;

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
  updateRecommendations();
}

async function updateRecommendations() {
  if (!state.origin) return;
  const cfg = DISASTERS[state.disaster];
  shelterList.innerHTML = `<li class="empty">避難所を評価中…</li>`;

  const all = await loadShelters();
  const ranked = await rankShelters(state.origin, state.disaster, cfg, 3);
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

boot();
