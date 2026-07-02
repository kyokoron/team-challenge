# 災害時避難シミュレーター

ハザードマップと標高を考慮して、災害の種類に応じた避難所・避難ルートを提案する Web アプリ。
Google マップのような単純な最短経路ではなく、**「なぜその避難所・ルートが良いのか」を根拠付きで示す意思決定支援**を目的としています。

> ⚠ 平常時の学習・避難計画支援のための**参考情報**です。実際の災害時は自治体・気象庁の最新情報と現地の状況に従ってください。

## できること

- 現在地取得（位置情報が使えない環境では地図クリックで指定）
- 地図表示（地理院タイル）
- 災害種別の切替（地震 / 津波 / 洪水 / 土砂災害）
- ハザードマップの重畳表示（重ねるハザードマップのタイル）
- 災害種別に応じた避難所のランキングと**推奨理由の表示**
  - 「徒歩◯分」「◯◯の指定避難先に対応」「標高◯m（津波時に有利）」など
  - 津波時は標高APIで高台を優先
- 避難ルート探索（OpenRouteService／洪水時は回避ポリゴンがあれば浸水域を回避）

## 技術構成（すべて無料）

| 役割 | 使用技術 |
|---|---|
| 地図描画 | MapLibre GL JS（CDN） |
| ベース地図 | 地理院タイル（淡色地図） |
| ハザード表示 | 重ねるハザードマップ ラスタタイル（洪水/津波/土砂） |
| 標高 | 国土地理院 標高API |
| ルート探索 | OpenRouteService（徒歩・avoid_polygons） |
| 避難所データ | GeoJSON（同梱サンプル。本番は国土数値情報に差し替え） |
| ホスティング | GitHub Pages 等の静的ホスティング |

バックエンド・DB は不要（全ロジックはクライアントサイド）。

## ローカルでの起動

ES モジュールを使うため、`file://` ではなく HTTP サーバ経由で開いてください。

```bash
# 任意の静的サーバでOK
python3 -m http.server 8000
# → http://localhost:8000 を開く
```

## デプロイ（GitHub Pages）

1. このリポジトリを push
2. Settings → Pages → Source を対象ブランチの `/ (root)` に設定
3. 公開URLにアクセス

## 避難ルート探索の有効化

1. [OpenRouteService](https://openrouteservice.org/dev/#/signup) で無料アカウントを作成し API キーを取得
2. アプリ左パネルの「⚙ ルート探索の設定」にキーを貼り付けて保存
   （キーはブラウザの localStorage に保存され、ルート計算時に ORS へのみ送信されます）

## 実データへの差し替え

- **避難所**: [国土数値情報「指定緊急避難場所」](https://nlftp.mlit.go.jp/ksj/)（Shapefile/GeoJSON）を取得し、
  `data/shelters.sample.geojson` と同じ構造（`name`, `kind`, `disasters`, `capacity`, `address`）に整形して差し替え。
- **洪水回避ポリゴン**（任意）: 国土数値情報「浸水想定区域」を GeoJSON 化し `data/hazard-flood.geojson` に配置すると、
  洪水時のルート探索で `avoid_polygons` として浸水域を回避します。

## ディレクトリ構成

```
index.html                 画面
css/style.css              スタイル
js/config.js               タイルURL・災害種別ごとの設定
js/map.js                  地図・レイヤ・マーカー制御
js/elevation.js            標高API
js/shelters.js             避難所読込・スコアリング・推奨理由生成
js/route.js                OpenRouteServiceルート探索
js/app.js                  画面と各モジュールの統合
data/shelters.sample.geojson  避難所サンプル（要差し替え）
docs/feasibility-review.md    技術実現性レビュー
```

## 既知の制約 / 今後の拡張

- ハザードタイルは表示専用（ラスタ）。ルートの浸水回避には別途ベクタのポリゴンが必要。
- 全国対応はデータ量的に非現実的なため、対象地域を絞る前提。
- 発展案: PWA によるオフライン対応、垂直避難の提案、複数避難所のスコア比較、AIによる避難アドバイス生成、「津波到達まで◯分 vs 徒歩◯分」タイムライン。

詳細な技術評価は [`docs/feasibility-review.md`](docs/feasibility-review.md) を参照。
