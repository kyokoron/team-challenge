// エリアの避難所を災害種別ごとに集計した横棒グラフ（インラインSVG・依存なし）。
// 単一系列（件数の大小）なので1色（ティール）で表現し、選択中の災害を濃色で強調する。

const ORDER = [
  { key: "earthquake", label: "地震" },
  { key: "tsunami", label: "津波" },
  { key: "typhoon", label: "台風・高潮" },
  { key: "flood", label: "洪水" },
  { key: "landslide", label: "土砂災害" },
];

const TEAL = "#157a8c";
const TEAL_DEEP = "#0f5f6e";
const TRACK = "#eef2f4";
const INK = "#1f2a33";
const INK_SOFT = "#55636e";

// container: DOM要素, counts: {key:count}, total: 総数, activeKey: 強調する災害キー
export function renderHazardChart(container, counts, total, activeKey) {
  const W = 300;
  const labelW = 68;
  const padRight = 30;
  const rowH = 30;
  const barH = 15;
  const barMaxW = W - labelW - padRight;
  const H = ORDER.length * rowH;
  const denom = Math.max(total, 1);

  const rows = ORDER.map((d, i) => {
    const c = counts[d.key] || 0;
    const w = (c / denom) * barMaxW;
    const y = i * rowH + (rowH - barH) / 2;
    const cy = i * rowH + rowH / 2;
    const active = d.key === activeKey;
    const fill = active ? TEAL_DEEP : TEAL;
    const labelWeight = active ? 700 : 500;
    return `
      <g>
        <text x="0" y="${cy}" dominant-baseline="middle" font-size="12"
              fill="${INK_SOFT}" font-weight="${labelWeight}">${d.label}</text>
        <rect x="${labelW}" y="${y}" width="${barMaxW}" height="${barH}" rx="4" fill="${TRACK}"/>
        <rect x="${labelW}" y="${y}" width="${Math.max(w, c > 0 ? 3 : 0)}" height="${barH}" rx="4" fill="${fill}">
          <title>${d.label}: ${c} / ${total} 施設</title>
        </rect>
        <text x="${W}" y="${cy}" text-anchor="end" dominant-baseline="middle"
              font-size="12" fill="${INK}" font-weight="${active ? 700 : 500}">${c}</text>
      </g>`;
  }).join("");

  container.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" width="100%" role="img"
         aria-label="災害種別ごとの対応避難所数">
      ${rows}
    </svg>`;
}
