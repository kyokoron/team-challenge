---
marp: true
paginate: true
title: AIを使った開発の知見共有
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
.lead { color: #123f45; font-weight: 700; font-size: 1.05em; margin: 0 0 .3em; }
.chain { display:flex; flex-direction:column; gap:5px; margin:6px 0; align-items:stretch; }
.chain span { background:#f4f6f5; border:1px solid #cdddda; border-radius:6px; padding:7px 10px; font-size:.72em; text-align:center; }
.chain .ar { border:none; background:none; color:#93a6a4; padding:0; font-size:.68em; }
.vc { background:#123f45; color:#fff; border-radius:6px; padding:9px 12px; margin-top:10px; font-weight:600; font-size:.74em; }
.vc.old { background:#eef1f0; color:#123f45; border:1px solid #cdddda; }
.cols.vcols { align-items: stretch; }
.vcols > div { display:flex; flex-direction:column; }
.vcols .vc { margin-top:auto; }
section.title { background: #123f45; color: #fff; justify-content: center; }
section.title h1 { color: #fff; font-size: 42px; margin-bottom:.15em; }
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

- テーマは、**AIを使った開発で得た知見の共有**
- 作った防災アプリは、その **題材**（成果物の紹介が目的ではない）
- 進め方
  - 題材の紹介 → 開発の進め方 → 知見①〜④ → まとめ

---

## 題材：作ったアプリ

- 災害時に、避難所と避難ルートを提案する Web アプリ
- 災害種別で提案が変わる／危険区域を避けるルート／オフライン対応
- 課題の必須要件（HTTPS・OIDC認証・Git管理）も充足
- 公開URL：https://kyokoron.github.io/team-challenge/

<p class="note">数時間で制作。以降は、この制作を通して得た知見を共有する。</p>

---

## 開発の進め方

- AI（Claude Code）と **対話しながら** 開発
- **コード作成は AI、要件定義・レビュー・判断は人** が担当
- 環境構築は不要。ブラウザ版の VS Code で作業し、GitHub の静的サイトとして公開
- 個人でも、サーバー・費用なしで開発から公開まで完結できる

---

## 知見① AIの出力は「検証前提」で使う

- AI は、もっともらしい回答を即座に出す。ただし誤りも混ざる
- 例：「DB が必要なのは投稿・更新のときだけ」と断定
  → 問い直すと、オフライン対応・更新頻度・コストなど論点は多かった
- **重要な判断ほど「本当にそうか」と問い返す**。鵜呑みにしない

---

## 知見②「動く」と「正しい」は別物

動作はするが、誤った挙動が複数あった。

- 内陸で「津波」を選ぶと、海側へ誘導していた
- データ取得に失敗すると、実在しない避難所を表示していた
- 広域データで距離計算が狂い、最寄り順が崩れていた
- 直線距離を、そのまま所要時間として表示していた

<p class="note">一見きちんと動いて見える。動作確認だけでは危うく、要件・安全面のレビューが要る。</p>

---

## 知見③ データ整備がボトルネックになりやすい

- コード生成は速い。一方で、データを「使える形」にする作業は残る
- オープンデータ特有の課題
  - どれが正解のデータか分かりにくい
  - ファイルが単位ごとに分割されている（例：洪水想定は河川単位）
  - 古い形式（Shapefile）で、変換・整形が必要

<p class="note">データ整備の工数を最初から見込む。整形自体は AI にも任せられる。</p>

---

## 知見④ 人の役割は「実装」から「判断」へ

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

<p class="note">実装の速さは AI に任せられる。人が担うのは、ドメイン理解・課題設定・レビュー。</p>

---

## まとめ：AI活用の勘所

- AI により、開発の速度は大きく向上する
- ただし出力は **検証前提**。品質・安全・最終判断は人が担う
- データ整備・課題設定など、**人が担う工程の比重が増す**
- 「作る」こと以上に、「何を・正しく作るか」を決める力が重要になる

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
