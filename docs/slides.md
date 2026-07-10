---
marp: true
paginate: true
title: AIで防災アプリを作ってみて
---

<style>
section {
  font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, "Noto Sans JP", sans-serif;
  background: #ffffff; color: #1b1a16; font-size: 25px; padding: 60px 66px; line-height: 1.65;
  display: flex; flex-direction: column; justify-content: flex-start;
}
h1 { color: #123f45; font-size: 38px; }
h2 { color: #123f45; border-bottom: 2px solid #1c5b63; padding-bottom: .18em; font-size: 29px; margin: 0 0 .8em; }
h3 { color: #1c5b63; font-size: 20px; margin: .1em 0 .3em; }
strong { color: #0e3a40; font-weight: 700; }
a { color: #1c5b63; }
ul, ol { margin: .2em 0; padding-left: 1.3em; }
li { margin: .5em 0; }
li ul { margin: .2em 0; }
li li { margin: .28em 0; font-size: .92em; color: #45433d; }
table { font-size: .84em; border-collapse: collapse; }
th { background: #123f45; color: #fff; }
td, th { border: 1px solid #d8d4cc; padding: 6px 10px; }
small { color: #6b6862; }
section::after { color: #b3aea4; font-size: 15px; }
.cols { display: flex; gap: 40px; align-items: flex-start; margin-top: .3em; }
.cols > div { flex: 1; }
.note { color: #6b6862; font-size: .82em; margin-top: 1.2em; }
.chain { display:flex; flex-direction:column; gap:5px; margin:6px 0; align-items:stretch; }
.chain span { background:#f4f6f5; border:1px solid #cdddda; border-radius:6px; padding:7px 10px; font-size:.72em; text-align:center; }
.chain .ar { border:none; background:none; color:#93a6a4; padding:0; font-size:.68em; }
.vc { background:#123f45; color:#fff; border-radius:6px; padding:9px 12px; margin-top:10px; font-weight:600; font-size:.74em; }
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

# AIで防災アプリを作ってみて

### 開発を通して学んだこと

<hr>

開発メンバー勉強会 ／ 課題1
Kyoko Takazawa

---

## 目次

1. 課題と要件
2. 作ったもの
3. 開発方法
4. 学んだこと
5. まとめ

---

## 課題と要件

- 課題1：アプリケーションを一つ、自分で作る
- 必須要件：**HTTPS ／ OIDC認証 ／ Git管理**
- テーマは自由。何を作るかも自分で決める

---

## 作ったもの：災害時避難シミュレーター

- 災害時に、避難所と避難ルートを提案する Web アプリ
- 災害種別（地震・津波・台風・洪水・土砂）で提案が変わる
- 危険な浸水区域を避けるルート、オフライン対応
- 公開URL：https://kyokoron.github.io/team-challenge/

---

## 開発方法

- AI（Claude Code）と対話しながら開発
- コード作成は AI、要件定義・レビュー・判断は自分が担当
- 構成：GitHub の静的サイト（サーバー・DB なし）、認証は Auth0（OIDC）
- 開発から公開まで、すべてブラウザで完結

---

## 学んだこと① AIの出力は検証が必要

- AI は、もっともらしい回答を即座に出す
- 例：「DB が必要なのは投稿・更新のときだけ」と断定
  → 問い直すと、オフライン対応・更新頻度・コストなど論点は多かった
- 出力を鵜呑みにせず、**検証と問い直し**が欠かせない

---

## 学んだこと②「動く」と「正しい」は別

動作はするが、誤った挙動が複数あった。

- 内陸で「津波」を選ぶと、海側へ誘導していた（避難所が沿岸に偏るため）
- データ取得に失敗すると、実在しない避難所を表示していた
- 広域データで距離計算が狂い、最寄り順が崩れていた
- 直線距離を、そのまま所要時間として表示していた

<p class="note">危険時は垂直避難を促す、不正なデータは表示しない、など安全側へ修正した。</p>

---

## 学んだこと③ データ整備に手間がかかる

- 避難所・ハザード情報は、国のオープンデータで揃う（無料）
- ただし実際に使うには課題があった
  - どれが正解のデータか分かりにくい
  - 洪水浸水想定は河川単位で分割されている
  - 古い形式（Shapefile）で、変換・整形が必要

<p class="note">使える形に整える前処理に、実装と同程度の時間がかかった。</p>

---

## 学んだこと④ AI時代、価値の重心が移る

<div class="cols vcols">
<div>

<h3>これまで</h3>
<div class="chain"><span>ユーザー</span><span class="ar">↓ UIを操作</span><span>UI（アプリ）</span><span class="ar">↓</span><span>機能（ロジック）</span><span class="ar">↓</span><span>データ</span></div>
<div class="vc old">価値の中心：UI設計・機能開発・実装</div>

</div>
<div>

<h3>これから</h3>
<div class="chain"><span>ユーザー</span><span class="ar">↓ 目的を伝える</span><span>AI（理解・推論）</span><span class="ar">↓</span><span>データ</span></div>
<div class="vc">価値の中心：ドメイン理解・データ整備・課題設定</div>

</div>
</div>

<p class="note">実装の速さは AI に任せられる。人が担うのは、ドメイン理解・データ整備・課題設定。</p>

---

## まとめ

- AI により、開発の速度は大きく向上する
- 一方で、正しさ・安全性の判断は人が担う必要がある
- 作ること以上に、「何を・正しく作るか」を見極めることが重要だと感じた

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
