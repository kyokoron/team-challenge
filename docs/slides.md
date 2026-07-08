---
marp: true
paginate: true
title: AIと作る防災アプリ — 学びと考察
---

<style>
section {
  font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, "Noto Sans JP", sans-serif;
  background: #fbfaf7; color: #1b1a16; font-size: 24px; padding: 50px 60px; line-height: 1.55;
}
h1 { color: #123f45; font-size: 38px; }
h2 { color: #123f45; border-bottom: 3px solid #1c5b63; padding-bottom: .16em; font-size: 29px; margin-bottom: .5em; }
h3 { color: #1c5b63; font-size: 21px; margin: .1em 0 .3em; }
strong { color: #0e3a40; }
a { color: #1c5b63; }
code { background: #eef1f0; padding: 1px 6px; border-radius: 4px; font-size: .9em; }
table { font-size: .8em; border-collapse: collapse; }
th { background: #123f45; color: #fff; }
td, th { border: 1px solid #d8d4cc; padding: 6px 10px; }
blockquote { border-left: 4px solid #1c5b63; color: #3c3a34; padding: .2em 0 .2em .8em; font-size: 1.02em; }
small { color: #6b6862; }
img { border-radius: 10px; }
section::after { color: #a49f95; font-size: 15px; }
.cols { display: flex; gap: 34px; align-items: flex-start; }
.cols > div { flex: 1; }
.lead { font-size: 1.14em; color: #123f45; font-weight: 600; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px; }
.box { border-radius: 10px; padding: 14px 18px; font-size: .92em; }
.box b { display:block; margin-bottom: 3px; }
.box.warn { background: #f8ede6; border: 1px solid #eecebb; color: #8f3d10; }
.box.good { background: #e9f2ec; border: 1px solid #cbe3d5; color: #1f6b46; }
.box.accent { background: #e9efed; border: 1px solid #cdddda; color: #123f45; }
.flow { display:flex; align-items:center; gap:10px; justify-content:center; margin-top:18px; flex-wrap:wrap; }
.flow .n { background:#fff; border:1.5px solid #cdddda; border-radius:10px; padding:12px 16px; font-size:.82em; text-align:center; }
.flow .a { color:#8aa; font-size:20px; }
section.title { background: #123f45; color: #fff; justify-content: center; }
section.title h1 { color: #fff; font-size: 46px; margin-bottom:.1em; }
section.title h3 { color: #bcd3cf; font-weight: 500; }
section.title hr { border:none; border-top:2px solid #2f6b71; width:80px; margin:24px 0; }
section.section { background: #123f45; color: #fff; justify-content: center; }
section.section h2 { color:#fff; border:none; font-size:38px; }
section.section p { color:#bcd3cf; }
</style>

<!-- _class: title -->

# AI と作る防災アプリ

### 「災害時避難シミュレーター」制作を通じた学びと考察

<hr>

開発メンバー勉強会 ／ 課題1：アプリケーションシステム作成
Kyoko Takazawa

---

## 今日話すこと

<p class="lead">「すごいものを作った」報告ではありません。</p>

- 何を作ったかは **さらっと**
- 中心は **作る過程で得た学び・葛藤**、そして
  **AI（Claude Code）と開発してみた所感**
- うまくいったことも、**危なかった・失敗したことも正直に**

> 「正解はない」課題なので、自分が体験して考えたことを話します

---

## 作ったもの（概要）

<div class="cols">
<div>

**災害時避難シミュレーター**
ハザードを考慮して避難所・避難ルートを提案する Web アプリ

- 災害種別（地震/津波/台風/洪水/土砂）で提案が変わる
- 危険区域（浸水域）を避けるルート
- オフライン対応・OIDC認証・HTTPS（課題の必須要件）

</div>
<div>

🔗 https://kyokoron.github.io/team-challenge/
（完全無料・GitHub Pages）

<div class="box accent">
本編ではこのアプリを「学びの題材」として扱います。機能の詳細は付録に。
</div>

</div>
</div>

---

## 進め方：AI と対話しながら作った

<div class="flow">
<div class="n">アイデアを<br>AIに評価させる</div>
<div class="a">→</div>
<div class="n">実装<br>（叩き台を高速生成）</div>
<div class="a">→</div>
<div class="n">実データ投入<br>（国のオープンデータ）</div>
<div class="a">→</div>
<div class="n">動かして<br>違和感を指摘</div>
<div class="a">↺</div>
</div>

<br>

- Claude Code に指示 → 動くものが出る → **触って気づく → 直す**、の反復
- 私の役割は「作る人」というより **「問いを立て、判断し、レビューする人」** に近かった

---

<!-- _class: section -->

## 学び ①
AI の答えを鵜呑みにしない

---

## 「DB は要らない」— 本当に？

- 最初、AI は「DBが要るのは動的更新・投稿の時だけ」と **簡略に断言**
- 「それ、総合的に考えて本当？発表で必ず突っ込まれる」と **問い直した**
- 深掘りすると論点は複数（検索性能・県境・更新・**オフライン**・コスト…）

<div class="box accent">
結論：この防災アプリは<b>被災時に通信が落ちる</b>前提。<b>サーバDBは"必要な瞬間に頼れない"</b>ので、静的分割＋端末キャッシュが最適。DBを使うなら最終的に端末へ配布が必要（ハイブリッド）。
</div>

> AI は"それらしい答え"を速く出す。**問い直すと精度が上がる**。

---

<!-- _class: section -->

## 学び ②
「ミスが許されない」設計の難しさ

---

## 実際に見つけた"危うい挙動"

避難案内は誤ると命に関わる。動かして初めて気づいた例：

<div class="grid2">
<div class="box warn"><b>内陸で「津波」を選ぶと海へ8km誘導</b>指定避難所が沿岸に偏在 → 逆方向は致命的</div>
<div class="box warn"><b>架空のサンプルデータが表示され得た</b>取得失敗時に偽の避難所を出す余地</div>
<div class="box warn"><b>"最寄り"が最寄りでない</b>広域データで距離が正規化され順位が崩れる</div>
<div class="box warn"><b>直線距離を「徒歩◯分」と表示</b>川や線路で実際は遠い＝過小表示</div>
</div>

---

## 学び：安全側に倒す設計に作り直した

![bg right:34%](img/danger.png)

- 対象外の地点は **遠くへ誘導せず「垂直避難を」** と警告
- **偽データを完全排除**（取得失敗は正直に止める）
- **現在地が浸水域内なら最優先で警告**（右図）
- 「できないこと（危険区域の自動回避なし等）」も**明示**

> "動く"と"正しい・安全"は別物。**AIは前者を作れるが、後者は人が問い続ける**。

---

<!-- _class: section -->

## 学び ③
オープンデータのリアル

---

## 「あるのに、取りにくい」

- 避難所・ハザードは **国のオープンデータで揃う**（無料・商用可なものも）
- が、実際は…
  - どれが正解のデータか **分かりにくい**（例：避難所は複数種別）
  - 洪水浸水想定(A31)は **河川単位** で「東京の1ファイル」が無い
  - **Shapefile** が多く、GeoJSON化・座標系・簡略化の前処理が要る
  - ルートAPI(ORS)は **回避ポリゴンの上限** があり工夫が必要

<div class="box good">
学び：<b>データ整形・前処理が実装と同じくらい重い</b>。ここをAIに任せて高速化できたのは大きかった。
</div>

---

<!-- _class: section -->

## 学び ④
無料・静的でどこまでできるか

---

## 制約の中の工夫

![bg right:33%](img/offline.png)

- **オフライン(PWA)**：地域データを IndexedDB に保存 →
  一度見た地域は **圏外でも検索が動く**
- **OIDC認証(Auth0)** を **バックエンドなし** で実現（PKCE）
- **浸水域を避けるルート**（ORSの`avoid_polygons`）
- すべて **GitHub Pages（静的・無料・HTTPS）**

> 「無料・静的」は制約だが、**設計思想（平常時に備え被災時に使う）と噛み合った**。

---

<!-- _class: section -->

## 本題：AI で開発してみた所感

---

## 得意・不得意・危ないところ

| AIが得意 | 人間の判断が必要 | 危なかった点 |
|---|---|---|
| 叩き台の高速生成 | 何を・なぜ作るか | "それっぽく動く"が正しくない |
| CSS/UI調整の反復 | 安全・倫理要件 | 偽データfallbackを平然と残す |
| データ変換・前処理 | 優先順位づけ | 誤ったランキングに気づかない |
| 定型実装・リファクタ | 「この挙動おかしい」の指摘 | レビューを怠ると事故 |

<p class="lead">AIで開発の速度は上がる。だが"最後の判断とレビュー"は人間の仕事だと痛感。</p>

---

## 私が介入した場面（実例）

- 「UIがAIっぽい・ださい」→ サイドバー型に刷新、幅で組み変わるUIへ
- 「津波の挙動がおかしい」→ 内陸の誤誘導を発見・修正
- 「ログインとログアウトが両方出てる」→ 表示バグを指摘・修正
- 「DBは本当に不要？」→ 設計判断を問い直し

> **AIは指摘に強い**。的確に問い返すほど、良いものに近づいた。

---

## 苦労・失敗したこと

- 動いているように見えて **裏で"偽データ・誤順位"** が潜んでいた
- データ入手・変換で何度もつまずいた（河川単位・Shapefile・API制限）
- 認証やオフラインは **一度で動かず**、原因切り分けを繰り返した
- 「見た目」は主観で、**"良い"の言語化が難しい**（何度も作り直し）

<div class="box accent">
失敗の多くは「動かして初めて分かる」もの。<b>触る→気づく→直すの反復</b>が結局いちばん効いた。
</div>

---

## もし次にやるなら / 活かし方

- **最初に"安全要件・NG挙動"を言語化** してからAIに作らせる
- AIの出力は **「たたき台」** と割り切り、**必ず自分で触ってレビュー**
- データ前処理は **AIに任せて高速化**、判断は自分が持つ
- チーム開発なら「AIの成果物をどうレビューするか」の仕組みが要る

---

## まとめ（学び）

- AIで **作る速度は劇的に上がる**。ただし **"正しさ・安全・見栄え"は人が問い続ける**
- **問いを立てる力・違和感に気づく力・レビューする力** が、これまで以上に重要に
- 防災という題材で **「動く」より「間違えない」** の難しさを体感できた
- 制約（無料・静的）は、**設計思想と噛み合えば強みになる**

<p class="lead">結論：AIは "答えをくれる相棒" ではなく、"速く形にする相棒"。舵は人が握る。</p>

---

<!-- _class: section -->

## 付録：成果物の概要

---

## 機能・技術・データ（付録）

<div class="cols">
<div>

**主な機能**
- 災害種別に応じた避難所ランキング（理由つき）
- 浸水域を避ける避難ルート／垂直避難の警告
- 現在地の浸水域内 警告
- オフライン（PWA）／ OIDC認証 ＋ HTTPS

</div>
<div>

**技術・データ**
- Vanilla JS / MapLibre GL JS / Auth0(OIDC)
- Service Worker + IndexedDB
- 国土地理院（地図・避難所・標高）
- 国土数値情報（洪水浸水想定 A31）
- OpenRouteService（回避ルート）

</div>
</div>

🔗 https://kyokoron.github.io/team-challenge/
