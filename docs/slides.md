---
marp: true
paginate: true
title: AIを使った開発の知見共有
---

<style>
section {
  font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, "Noto Sans JP", sans-serif;
  background: #ffffff; color: #1b1a16; font-size: 26px; padding: 54px 60px; line-height: 1.8;
  display: flex; flex-direction: column; justify-content: flex-start;
}
h1 { color: #123f45; font-size: 40px; }
h2 {
  background: #eef2f1; color: #123f45; font-size: 32px; font-weight: 700;
  padding: 14px 24px; border-radius: 10px; margin: 0 0 .9em; line-height: 1.4;
}
h3 { color: #1c5b63; font-size: 20px; margin: .1em 0 .3em; }
strong { color: #0e3a40; font-weight: 700; }
a { color: #1c5b63; }
ul, ol { margin: .1em 0; padding-left: 1.2em; }
li { margin: .7em 0; }
li ul { margin: .35em 0 .1em; }
li li { margin: .4em 0; font-size: .9em; color: #45433d; }
table { font-size: .82em; border-collapse: collapse; }
th { background: #123f45; color: #fff; }
td, th { border: 1px solid #d8d4cc; padding: 6px 10px; }
small { color: #6b6862; }
section::after { color: #b3aea4; font-size: 15px; }
.cols { display: flex; gap: 40px; align-items: flex-start; margin-top: .2em; }
.cols > div { flex: 1; }
.cols.cards { align-items: stretch; gap: 28px; }
.card { border-radius: 12px; padding: 22px 26px; }
.card h3 { margin: 0 0 .55em; font-size: 23px; }
.card ul { padding-left: 1.15em; margin: 0; }
.card li { margin: .5em 0; font-size: .95em; }
.card.ai { background:#f3f5f4; border:1px solid #dde3e1; }
.card.ai h3 { color:#5c6b68; }
.card.human { background:#e9f3ed; border:2px solid #1c5b63; }
.card.human h3 { color:#12603f; }
.note { color: #5c5a54; font-size: .84em; margin-top: 1em; line-height: 1.7; }
.chain { display:flex; flex-direction:column; gap:5px; margin:4px 0; align-items:stretch; }
.chain span { background:#f4f6f5; border:1px solid #cdddda; border-radius:6px; padding:6px 10px; font-size:.62em; text-align:center; }
.chain .ar { border:none; background:none; color:#93a6a4; padding:0; font-size:.58em; }
.vc { background:#123f45; color:#fff; border-radius:6px; padding:8px 12px; margin-top:9px; font-weight:600; font-size:.62em; }
.vc.old { background:#eef1f0; color:#123f45; border:1px solid #cdddda; }
.cols.vcols { align-items: stretch; }
.vcols > div { display:flex; flex-direction:column; }
.vcols .vc { margin-top:auto; }
section.title { background: #123f45; color: #fff; justify-content: center; }
section.title h1 { color: #fff; font-size: 44px; margin-bottom:.15em; }
section.title h3 { color: #bcd3cf; font-weight: 500; }
section.title hr { border:none; border-top:1px solid #3a6d72; width:70px; margin:22px 0; }
</style>

<!-- _class: title -->

# AIを使った開発の知見共有

### 防災アプリの制作を題材に

<hr>

開発メンバー勉強会 ／ 課題1
Kyoko Takazawa

---

## この発表について

- テーマは「**AIを使った開発で得た知見の共有**」です
- 作った防災アプリは、その**題材**です
  <small>（成果物の紹介が目的ではありません）</small>
- 題材の紹介 → 開発の進め方 → 知見①〜④ → まとめ、の順で話します

---

## 題材：作ったアプリ

- 災害時に、避難所と避難ルートを提案する Web アプリです
- 災害種別で提案が変わり、危険な区域を避けて案内します
- 数時間で作りました

<p class="note">公開URL：https://kyokoron.github.io/team-challenge/<br>以降は、この制作を通して得た知見を共有します。</p>

---

## 開発の進め方

- AI（Claude Code）と **対話しながら** 開発しました
- コードを書くのは AI、**要件・レビュー・判断は自分**が担当します
- 環境構築は不要で、**すべてブラウザで完結**します
  <small>（ブラウザ版 VS Code ＋ GitHub の静的サイト）</small>

---

## 知見① AIの出力は「検証前提」で使う

- AIは、もっともらしい回答をすぐ返します
  ただし、**誤りが混ざることがあります**
- 例：「DBが必要なのは投稿・更新のときだけ」と断定しました
  問い直すと、オフラインや更新頻度など、論点はもっとありました

<p class="note">重要な判断ほど「本当にそうか」と問い返す。鵜呑みにしないことが大切です。</p>

---

## 知見②「動く」と「正しい」は別

動作はしても、誤った挙動が複数ありました。

- 内陸で「津波」を選ぶと、海側へ誘導していた
- 取得に失敗すると、実在しない避難所を表示していた
- 距離計算が狂い、最寄り順が崩れていた

<p class="note">一見きちんと動いて見えるため、動作確認だけでは危険です。<br>要件や安全面のレビューが欠かせません。</p>

---

## 知見③ データ整備に手間がかかる

- コード生成は速いですが、
  データを「使える形」にする作業は残ります
- オープンデータには、こんな壁がありました
  - どれが正解のデータか分かりにくい
  - ファイルが単位ごとに分かれている
  - 古い形式で、変換や整形が必要

<p class="note">データ整備の工数を、最初から見込んでおくと安全です。</p>

---

## 知見④ 人の役割は「実装」から「判断」へ

<div class="cols cards">
<div class="card ai">

### AIに任せられること
- 実装（コードを書く）
- 定型的な修正・リファクタ
- データの変換・整形

</div>
<div class="card human">

### 人が担うこと
- 何を作るか（課題設定）
- ドメインの理解
- 出力の検証・レビュー
- 品質と安全の最終判断

</div>
</div>

<p class="note">実装の速さは AI に任せ、人は「判断」に集中する。役割の重心が移っています。</p>

---

## まとめ

- AI で、開発の速度は大きく上がります
- ただし出力は **検証前提**。品質や安全の判断は人が担います
- データ整備や課題設定など、**人が担う工程の比重が増します**
- 「作る」こと以上に、「何を・正しく作るか」を決める力が重要になります

---

## 付録：技術・データ

<div class="cols">
<div>

**主な機能**
- 災害種別に応じた避難所ランキング
- 浸水域を避ける避難ルート
- 現在地が危険なときの警告
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
