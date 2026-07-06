import { DISASTERS } from "./config.js";
import { makeShelters, rankShelters } from "./shelters.js";
import {
  loadIndex,
  resolveRegion,
  fetchRegionFeatures,
  saveRegion,
  deleteRegion,
  getSavedFeatures,
  getSavedList,
  getAllSavedFeatures,
} from "./regionstore.js";
import {
  initMap,
  setHazardLayers,
  setCurrentLocation,
  setShelterDots,
  setTopMarkers,
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
  activeShelters: [], // 現在表示・検索対象の地域の避難所
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
const regionList = $("#region-list");
const regionStatus = $("#region-status");
const orsKeyInput = $("#ors-key");
const saveKeyBtn = $("#save-key-btn");
const keyStatus = $("#key-status");

export async function startApp() {
  await initMap();
  applyDisaster("earthquake");

  // 既定地域（indexの先頭＝東京）を表示用に読み込み、グラフ・マーカーを描画
  await loadDefaultRegion();
  await refreshRegionManager();

  // オンライン/オフラインの切替を地域マネージャに反映
  window.addEventListener("online", refreshRegionManager);
  window.addEventListener("offline", refreshRegionManager);

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

  // 画面サイズ/向きの変化で地図を再計算（モバイルのURLバー・回転対策）
  window.addEventListener("resize", () => resizeMap());
  setTimeout(resizeMap, 300);

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

// 表示・検索対象の避難所を差し替え、グラフ/件数/マーカーを更新
function setActiveShelters(features) {
  state.activeShelters = makeShelters(features);
  computeCounts(state.activeShelters);
  renderChart();
  setShelterDots(state.activeShelters); // 全施設は軽量な円レイヤ
  refreshMarkers();
}

function refreshMarkers() {
  setTopMarkers(state.ranked, (s) => selectShelter(s.id)); // 上位のみ番号ピン
}

// 起動時の既定地域を表示（保存済みがあればそれ、無ければfetch）
async function loadDefaultRegion() {
  try {
    const index = await loadIndex();
    if (!index.length) return;
    const def = index[0];
    let feats = await getSavedFeatures(def.code).catch(() => null);
    if (!feats) feats = await fetchRegionFeatures(def).catch(() => []);
    setActiveShelters(feats);
  } catch (e) {
    console.warn("既定地域の読込に失敗:", e);
  }
}

// 地点に対応する避難所データを用意する（オンラインは自動保存＝平常時に備える）
async function ensureFeaturesForPoint(lon, lat) {
  const index = await loadIndex().catch(() => []);
  const region = resolveRegion(index, lon, lat);
  const online = navigator.onLine;

  if (region) {
    const saved = await getSavedFeatures(region.code).catch(() => null);
    if (saved) return { features: saved, note: `${region.name}（保存済み・オフライン利用可）` };
    if (online) {
      try {
        const feats = await saveRegion(region); // 取得＋自動保存
        await refreshRegionManager();
        return { features: feats, note: `${region.name}を取得・保存しました（次回オフライン可）` };
      } catch (e) {
        const feats = await fetchRegionFeatures(region).catch(() => []);
        return { features: feats, note: `${region.name}を取得しました（保存に失敗）` };
      }
    }
    const all = await getAllSavedFeatures();
    return { features: all, note: `オフライン：${region.name}は未保存。保存済み地域から検索します。` };
  }

  if (online) {
    return { features: [], note: "この地点周辺の避難所データは未提供です（現在は東京都のみ）。" };
  }
  const all = await getAllSavedFeatures();
  return { features: all, note: "オフライン：保存済み地域から検索します。" };
}

// オフライン地域マネージャの一覧を再描画
async function refreshRegionManager() {
  if (!regionList) return;
  const index = await loadIndex().catch(() => []);
  const saved = await getSavedList().catch(() => []);
  const savedCodes = new Set(saved.map((s) => s.code));

  regionList.innerHTML = index
    .map((r) => {
      const s = savedCodes.has(r.code);
      return `<li class="region-item">
        <div class="region-info">
          <span class="region-name">${r.name}</span>
          <span class="region-meta">${r.count}施設${s ? " ・ 📥保存済み(オフライン可)" : ""}</span>
        </div>
        <button class="region-btn ${s ? "is-saved" : ""}" data-code="${r.code}" data-act="${s ? "del" : "save"}">${s ? "削除" : "保存"}</button>
      </li>`;
    })
    .join("");
  regionList.querySelectorAll(".region-btn").forEach((b) => b.addEventListener("click", onRegionBtn));

  if (regionStatus) {
    regionStatus.textContent = navigator.onLine
      ? "地域を保存すると、圏外でもその地域で検索できます（旅行前の保存に）。"
      : "⚠ オフライン中：保存済み地域のみ利用できます。";
  }
}

async function onRegionBtn(e) {
  const btn = e.currentTarget;
  const code = btn.dataset.code;
  const act = btn.dataset.act;
  btn.disabled = true;
  btn.textContent = act === "save" ? "保存中…" : "削除中…";
  try {
    const index = await loadIndex();
    const region = index.find((x) => x.code === code);
    if (act === "save") await saveRegion(region);
    else await deleteRegion(code);
  } catch (err) {
    alert("地域の保存/削除に失敗しました: " + err.message);
  }
  await refreshRegionManager();
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
      // 失敗時は「地図タップで指定」モードへ誘導
      enablePickMode();
      const byCode = {
        1: "位置情報の利用が許可されていません。ブラウザ/端末の設定で許可するか、地図をタップして場所を指定してください。",
        2: "現在地を取得できませんでした（電波状況など）。地図をタップして場所を指定してください。",
        3: "現在地の取得がタイムアウトしました。もう一度お試しになるか、地図をタップして指定してください。",
      };
      locationStatus.textContent = byCode[err.code] || `取得失敗: ${err.message}。地図をタップして指定できます。`;
    },
    // 屋内でも速く・確実に取れるよう高精度は使わずタイムアウトを長めに
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
  );
}

// 「地図タップで場所を指定」モードのON/OFF
function enablePickMode() {
  clickToSetEnabled = true;
  pickBtn.classList.add("is-active");
  mapWrap.classList.add("picking");
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

  // 地点に対応する地域データを用意（オンラインは自動保存）
  const { features, note } = await ensureFeaturesForPoint(state.origin.lon, state.origin.lat);
  if (regionStatus && note) regionStatus.textContent = note;
  setActiveShelters(features);

  if (!state.activeShelters.length) {
    state.ranked = [];
    shelterList.innerHTML = `<li class="empty">この地点周辺の避難所データがありません。左の「オフライン地域」で対象地域を保存するか、対応地域から試してください。</li>`;
    shelterCount.textContent = "0件";
    return;
  }

  const ranked = await rankShelters(state.origin, state.disaster, cfg, 5, state.activeShelters);
  state.ranked = ranked;

  refreshMarkers();
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
    const km = route.distance ? (route.distance / 1000).toFixed(2) : null;
    const min = route.duration ? Math.round(route.duration / 60) : null;
    let msg = `実ルート: 徒歩約${min ?? "?"}分` + (km ? `（${km}km）` : "");
    let type = "info";
    if (route.avoided) {
      msg += " ／ 浸水想定区域を回避した経路";
      type = "good";
    } else if (route.avoidFailed) {
      msg += " ／ ⚠ 危険区域の回避に失敗（通常経路を表示）。現地の状況を必ず確認してください";
      type = "warn";
    } else {
      msg += " ／ ※通常の徒歩経路です（危険区域の自動回避はしていません）";
    }
    appendRouteHint(shelter, msg, type);
  } catch (e) {
    let m;
    if (e.message === "NO_KEY") m = "APIキー未設定のためルート線は表示されません。";
    else if (e.message === "NO_SAFE_ROUTE")
      m = "浸水を避ける安全な経路が見つかりません。近くの高い建物への垂直避難や、別の避難先を検討してください。";
    else m = `ルート取得失敗: ${e.message}`;
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
