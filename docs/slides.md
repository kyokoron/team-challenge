---
marp: true
paginate: true
title: AIで防災アプリを作ってみて
---

<style>
section {
  font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, "Noto Sans JP", sans-serif;
  background: #fbfaf7; color: #1b1a16; font-size: 25px; padding: 58px 64px; line-height: 1.6;
  display: flex; flex-direction: column; justify-content: flex-start;
}
section > *:first-child { margin-top: 0; }
h1 { color: #123f45; font-size: 38px; }
h2 { color: #123f45; border-bottom: 3px solid #1c5b63; padding-bottom: .16em; font-size: 30px; margin: 0 0 .7em; }
h3 { color: #1c5b63; font-size: 21px; margin: .1em 0 .3em; }
strong { color: #0e3a40; font-weight: 700; }
a { color: #1c5b63; }
ul { margin: .2em 0; }
li { margin: .34em 0; }
code { background: #eef1f0; padding: 1px 6px; border-radius: 4px; font-size: .9em; }
table { font-size: .82em; border-collapse: collapse; }
th { background: #123f45; color: #fff; }
td, th { border: 1px solid #d8d4cc; padding: 6px 10px; }
blockquote { border-left: 4px solid #1c5b63; color: #3c3a34; padding: .2em 0 .2em .8em; font-size: 1.02em; margin-top: .8em; }
small { color: #6b6862; }
section::after { color: #a49f95; font-size: 15px; }
.cols { display: flex; gap: 34px; align-items: flex-start; }
.cols > div { flex: 1; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 8px; }
.box { border-radius: 10px; padding: 14px 18px; font-size: .9em; }
.box > b { display:block; margin-bottom: 3px; }
.box strong, .box b { color: inherit; }
.box.warn { background: #f8ede6; border: 1px solid #eecebb; color: #8f3d10; }
.box.good { background: #e9f2ec; border: 1px solid #cbe3d5; color: #1f6b46; }
.box.accent { background: #e9efed; border: 1px solid #cdddda; color: #123f45; }
.flow { display:flex; align-items:center; gap:10px; justify-content:center; margin:22px 0; flex-wrap:wrap; }
.flow .n { background:#fff; border:1.5px solid #cdddda; border-radius:10px; padding:12px 16px; font-size:.8em; text-align:center; }
.flow .a { color:#8aa; font-size:20px; }
.chain { display:flex; flex-direction:column; gap:5px; margin:8px 0; align-items:stretch; }
.chain span { background:#fff; border:1.5px solid #cdddda; border-radius:8px; padding:7px 10px; font-size:.72em; text-align:center; }
.chain .ar { border:none; background:none; color:#93a6a4; padding:0; font-size:.68em; }
.vc { background:#123f45; color:#fff; border-radius:8px; padding:9px 12px; margin-top:10px; font-weight:600; font-size:.76em; }
.vc.old { background:#e9efed; color:#123f45; border:1px solid #cdddda; }
.cols.vcols { align-items: stretch; }
.vcols > div { display:flex; flex-direction:column; }
.vcols .vc { margin-top:auto; }
/* 大きな一言メッセージ用スライド */
section.msg { justify-content: center; }
.punch { font-size: 40px; color: #123f45; font-weight: 700; line-height: 1.55; margin: 0; }
.punch.s { font-size: 33px; }
.sub { font-size: 21px; color: #6b6862; margin-top: 24px; }
.mk { background: linear-gradient(transparent 60%, #bfe0d8 60%); padding: 0 .06em; }
section.title { background: #123f45; color: #fff; justify-content: center; }
section.title h1 { color: #fff; font-size: 46px; margin-bottom:.1em; }
section.title h3 { color: #bcd3cf; font-weight: 500; }
section.title hr { border:none; border-top:2px solid #2f6b71; width:80px; margin:24px 0; }
section.section { background: #123f45; color: #fff; justify-content: center; }
section.section h2 { color:#fff; border:none; font-size:40px; margin:0; }
section.section p { color:#bcd3cf; margin-top:.4em; }
</style>

<!-- _class: title -->

# AIで防災アプリを作ってみて

### 作ってわかった、AIに任せられること・任せちゃいけないこと

<hr>

開発メンバー勉強会 ／ 課題1
Kyoko Takazawa

---

<!-- _class: msg -->

<p class="punch">AIは、作る速さを<span class="mk">爆上げ</span>する。<br>でも「正しさ」の最後の一線は、<br><span class="mk">人が引くしかなかった</span>。</p>

<p class="sub">— 防災アプリを一本作って、いちばん強く感じたこと</p>

---

## 成果自慢は、しません

- 話すのは、作ってみて **感じたこと** の方
- 流れは、**課題 → 作ったもの → 感じたこと（本題）**

<blockquote>「正解はない」課題です。ひとつの "やってみた記録" として聞いてください。</blockquote>

---

## 課題：アプリを一本、自分で作る

- 必須要件は **HTTPS ／ OIDC認証 ／ Git管理**
- テーマは自由。**何を作るかから、自分で決める**

---

## 作ったのは「今すぐ、どこへ逃げる？」に答えるアプリ

- きっかけは、**最近よく揺れること**。
  「そういえば、自分はどこに逃げればいいんだろう？」
- 既存のハザードマップは情報が多くて、**とっさに答えをくれない**

<blockquote>「見て考える」地図ではなく、「今の答え」をくれるものが欲しかった。</blockquote>

---

## 作り方：AIと "壁打ち" しながら

<div class="flow">
<div class="n">やりたいことを<br>AIに伝える</div>
<div class="a">→</div>
<div class="n">動くものが<br>出てくる</div>
<div class="a">→</div>
<div class="n">触って<br>違和感に気づく</div>
<div class="a">→</div>
<div class="n">直す</div>
<div class="a">↺</div>
</div>

- 使ったのは **Claude Code（ブラウザ版）**。対話しながら進めた
- 正直、**私はほとんどコードを書いていない**。やっていたのは「問いを立てて、レビューする」こと

---

## できたもの（詳しくは付録に）

- 災害の種類で、逃げる先が **変わる**
- 危険な浸水エリアを **避けて** 案内する
- 電波が無くても、一度見た街なら **動く**（オフライン対応）

**公開URL** https://kyokoron.github.io/team-challenge/

---

<!-- _class: section -->

## ここからが本題
作って "感じたこと"

---

## AIは「それっぽい答え」を、自信満々に出す

- 最初 AI は「DBが要るのは投稿や更新のときだけ」と **言い切った**
- 「それ、本当？」と **問い直したら**、話が一気に深くなった
  （オフライン・県境・更新・コスト…論点は山ほどあった）

<div class="box accent">
鵜呑みにしなければ、AIは急に賢くなる。<strong>疑って問い直す</strong>のが、私の仕事だった。
</div>

---

<!-- _class: msg -->

<p class="punch">「動く」と「正しい」は、<br><span class="mk">まったくの別物</span>だった。</p>

<p class="sub">避難案内は、間違えると命に関わる。ここが一番の学び。</p>

---

## 触ってみて、正直ゾッとした

<div class="grid2">
<div class="box warn"><b>内陸で「津波」を選ぶと海へ8km誘導</b>避難所が沿岸に偏っていて、逆方向へ導いていた</div>
<div class="box warn"><b>取得に失敗すると "架空の避難所" が出た</b>存在しない場所へ逃がしかねない</div>
<div class="box warn"><b>"最寄り" が最寄りじゃない</b>広域データで距離計算が狂い、順位が崩れる</div>
<div class="box warn"><b>直線距離を「徒歩◯分」と表示</b>川や線路で実際はもっと遠い＝油断を生む</div>
</div>

<p class="sub" style="margin-top:16px">これ全部、AIは "ちゃんと動いてる風" に出してきた。</p>

---

## だから「安全側に倒す」まで作り直した

- 危ないときは遠くへ誘導せず、**「その場で上の階へ」** と伝える
- 取れないデータは、**偽物を出さず正直に止める**
- 今いる場所が危険なら、**最優先で警告する**

<blockquote>"動く" はAIが作れる。**"間違えない" は、人が問い続けるしかなかった。**</blockquote>

---

## オープンデータは「ある」。でも「使える」まで遠い

- 避難所もハザードも、**国のデータで揃う**（しかも無料）
- でも実際に使うと…
  - どれが正解のデータか **分かりにくい**
  - 洪水の想定は **河川ごとにバラバラ**で「街の1ファイル」が無い
  - 古い形式（Shapefile）で、**変換・整形が必要**

<div class="box good">
データを "使える形" に整える前処理が、<strong>実装と同じくらい重かった</strong>。
</div>

---

## AI時代、価値の「置き場所」が変わる

<div class="cols vcols">
<div>

<h3>これまで</h3>
<div class="chain"><span>ユーザー</span><span class="ar">↓ UIを操作</span><span>UI（アプリ）</span><span class="ar">↓</span><span>機能（ロジック）</span><span class="ar">↓</span><span>データ</span></div>
<div class="vc old">価値の中心：UI設計・機能開発・実装</div>

</div>
<div>

<h3>これから</h3>
<div class="chain"><span>ユーザー</span><span class="ar">↓ 目的を伝える</span><span>AI（理解・推論）</span><span class="ar">↓</span><span>データ</span></div>
<div class="vc">価値の中心：①ドメイン理解／②良いデータ／③何を解くか</div>

</div>
</div>

<p class="sub" style="margin-top:14px">コードを書く力より、<span class="mk">「何を解くべきか」を決める力</span>。</p>

---

## 今回、私がやっていたのは この3つ

<div class="grid2">
<div class="box accent"><b>① ドメインを理解する</b>「津波で海へ」の危うさに気づけたのは、コードでなく防災の理解だった</div>
<div class="box accent"><b>② 良いデータを用意する</b>オープンデータを "使える形" に整える。ここで品質が決まった</div>
<div class="box accent"><b>③ 何を解くかを決める</b>「動く」より「間違えない」。問いを立て直し、レビューし続けた</div>
<div class="box good"><b>＝ 実装の速さはAIに任せた</b>私はこの3つに集中していた（と、後で気づいた）</div>
</div>

---

## 後で知った：Anthropicも同じことを言っていた

<div class="grid2">
<div class="box accent"><b>「自分が何を知らないか」を明確にするほどAIは活きる</b>まさに、問い直すほど質が上がった</div>
<div class="box warn"><b>「地図は現地ではない」</b>指示とAIの理解にはズレがある → 触って初めて気づく、と重なった</div>
</div>

<p class="sub" style="margin-top:16px">自分の手探りが、公式の "コツ" と一致していて腑に落ちた。<br><small>参考：ナレッジセンス「Fable時代のAI活用法を、Anthropicの開発者が公開」(Zenn)</small></p>

---

## ちなみに、この資料も AI と作りました

- Marp ＝ スライドを **文章（テキスト）で書く** ツール
- だから **AIが読める・書ける・直せる** ／ Git で差分管理できる

<div class="box accent">
「テキストで伝える → AIが形にする」時代に、<strong>資料もテキストで持てる</strong>のは相性がいい。<br>（ただし凝ったビジュアル勝負なら、Canva等が今も有利）
</div>

---

## うまくいかなかったこと

- 動いてる風で、裏で **"偽データ・誤った順位"** が潜んでいた
- データの入手・変換で、**何度もつまずいた**
- 「見た目が微妙」を直すのが一番むずかしい（**"良い" の言語化**ができず作り直し多数）

---

<!-- _class: msg -->

<p class="punch">AIは「速く形にする相棒」。<br>でも <span class="mk">舵は、人が握る</span>。</p>

<p class="sub">一番の収穫は、成果物そのものより<br>「どこを自分がやるべきか」が見えたこと。</p>

---

<!-- _class: section -->

## 付録
成果物の概要

---

## 機能・技術・データ

<div class="cols">
<div>

**主な機能**
- 災害種別に応じた避難所ランキング（理由つき）
- 浸水域を避ける避難ルート／垂直避難の警告
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

**公開URL** https://kyokoron.github.io/team-challenge/
