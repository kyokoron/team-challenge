// 地域（都道府県）単位の避難所データを、静的ファイルから取得し IndexedDB に保存する。
//  - オンライン：地域ファイルを fetch し、使った地域は自動保存（＝平常時に備える）
//  - オフライン：保存済み地域だけで検索（＝被災時に使う）
// 地点→地域の判定は index.json の bbox で行うため、逆ジオコーディング不要＝オフラインでも判定できる。

const INDEX_URL = "./data/regions/index.json";
const REGION_DIR = "./data/regions/";
const DB_NAME = "hinan-regions";
const STORE = "regions";

let indexCache = null;

export async function loadIndex() {
  if (indexCache) return indexCache;
  const res = await fetch(INDEX_URL);
  if (!res.ok) throw new Error(`地域インデックスの取得に失敗: HTTP ${res.status}`);
  indexCache = await res.json();
  return indexCache;
}

// 点(lon,lat)を含む地域を index の bbox から判定（ローカル・オフライン可）
export function resolveRegion(index, lon, lat) {
  return (
    index.find((r) => {
      const [minLon, minLat, maxLon, maxLat] = r.bbox;
      return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
    }) || null
  );
}

// ---- IndexedDB ----
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "code" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    const r = fn(store);
    t.oncomplete = () => resolve(r && r.result !== undefined ? r.result : undefined);
    t.onerror = () => reject(t.error);
  });
}

// 地域ファイルを取得（保存はしない）
export async function fetchRegionFeatures(region) {
  const res = await fetch(REGION_DIR + region.file);
  if (!res.ok) throw new Error(`地域データの取得に失敗: HTTP ${res.status}`);
  const geojson = await res.json();
  return geojson.features || [];
}

// 地域を端末に保存（オフライン利用可にする）
export async function saveRegion(region) {
  const features = await fetchRegionFeatures(region);
  const db = await openDb();
  await tx(db, "readwrite", (s) =>
    s.put({ code: region.code, name: region.name, count: features.length, savedAt: Date.now(), features })
  );
  return features;
}

export async function deleteRegion(code) {
  const db = await openDb();
  await tx(db, "readwrite", (s) => s.delete(code));
}

export async function getSavedRecord(code) {
  const db = await openDb();
  return tx(db, "readonly", (s) => s.get(code));
}

export async function getSavedList() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, "readonly");
    const req = t.objectStore(STORE).getAll();
    req.onsuccess = () =>
      resolve(req.result.map(({ code, name, count, savedAt }) => ({ code, name, count, savedAt })));
    req.onerror = () => reject(req.error);
  });
}

export async function isSaved(code) {
  const rec = await getSavedRecord(code);
  return !!rec;
}

export async function getSavedFeatures(code) {
  const rec = await getSavedRecord(code);
  return rec ? rec.features : null;
}

// 保存済み全地域の避難所をまとめて返す（オフライン検索用）
export async function getAllSavedFeatures() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, "readonly");
    const req = t.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result.flatMap((r) => r.features));
    req.onerror = () => reject(req.error);
  });
}
