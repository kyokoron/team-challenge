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

### 作ってみてわかった、AIに任せられること・任せられないこと

<hr>

開発メンバー勉強会 ／ 課題1
Kyoko Takazawa

---

<!-- _class: msg -->

<p class="punch">AIを使うと、作るのは<span class="mk">驚くほど速い</span>。<br>でも「これで正しいか」の判断は、<br>最後まで<span class="mk">自分の仕事</span>だった。</p>

<p class="sub">— 防災アプリを一つ作って、いちばん感じたこと</p>

---

## この発表で話すこと

- 作ったものの説明は、簡単に
- 中心は、作ってみて **気づいたこと・考えたこと**

<blockquote>「正解のない」課題です。ひとつの体験談として聞いてください。</blockquote>

---

## 課題：アプリを一つ、自分で作る

- 必須要件は **HTTPS ／ OIDC認証 ／ Git管理**
- テーマは自由。**何を作るかも、自分で決める**

---

## 作ったのは「どこへ逃げればいい？」に答えるアプリ

- きっかけは、最近よく地震があること。
  「自分は、どこに逃げればいいんだろう」と考えた
- 既存のハザードマップは情報が多く、**とっさの判断には向かない**

<blockquote>「見て考える地図」ではなく、「その場の答え」がほしかった。</blockquote>

---

## 作り方：AIと対話しながら

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

- 使ったのは **Claude Code（ブラウザ版）**
- 私はほとんどコードを書いていない。していたのは、**問いを立てて確かめること**

---

## できたこと（詳しくは付録に）

- 災害の種類によって、逃げる先が **変わる**
- 危険な浸水エリアを **避けて** 案内する
- 電波がなくても、一度見た地域なら **使える**（オフライン対応）

**公開URL** https://kyokoron.github.io/team-challenge/

---

<!-- _class: section -->

## 本題
作ってみて、気づいたこと

---

## AIの答えは、そのままでは危うい

- 最初、AIは「DBが必要なのは投稿や更新のときだけ」と **言い切った**
- 「本当にそうか」と **問い直す** と、論点はもっと多かった
  （オフライン・県境・更新・コスト…）

<div class="box accent">
答えを鵜呑みにせず、確かめて問い直す。それが自分の役割だった。
</div>

---

<!-- _class: msg -->

<p class="punch">「動く」ことと「正しい」ことは、<br><span class="mk">別物</span>だった。</p>

<p class="sub">避難の案内は、間違えれば命に関わる。ここが一番の気づき。</p>

---

## 動かして初めて気づいた、危うさ

<div class="grid2">
<div class="box warn"><b>内陸で「津波」を選ぶと、海へ8km誘導</b>避難所が沿岸に偏り、逆方向へ導いていた</div>
<div class="box warn"><b>取得に失敗すると、実在しない避難所が出た</b>無い場所へ逃がしてしまいかねない</div>
<div class="box warn"><b>「最寄り」が最寄りでない</b>広域データで距離計算が狂い、順位が崩れる</div>
<div class="box warn"><b>直線距離を「徒歩◯分」と表示</b>川や線路で、実際はもっと遠い</div>
</div>

<p class="sub" style="margin-top:16px">どれも、一見きちんと動いているように見えた。</p>

---

## 「安全側に倒す」ところまで直した

- 危ないときは遠くへ誘導せず、**その場で上の階へ、と伝える**
- 取得できないデータは、**それらしい代わりを出さずに止める**
- 今いる場所が危険なら、**まず警告する**

<blockquote>「動く」ものはAIが作れる。「間違えない」ものは、**人が確かめ続けるしかなかった**。</blockquote>

---

## データは「ある」。でも「使える」までが遠い

- 避難所もハザードも、**国のデータで揃う**。しかも無料
- ただ、実際に使うと…
  - どれが正解のデータか **分かりにくい**
  - 洪水の想定は **河川ごとにファイルが分かれ**、「街の1ファイル」が無い
  - 古い形式（Shapefile）で、**変換・整形が必要**

<div class="box good">
使える形に整える前処理に、<strong>実装と同じくらい時間がかかった</strong>。
</div>

---

## AIの登場で、価値のありかが変わる

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

<p class="sub" style="margin-top:14px">コードを書く力より、<span class="mk">「何を解くか」を決める力</span>。</p>

---

## 今回、自分がやっていたのは この3つ

<div class="grid2">
<div class="box accent"><b>① ドメインを理解する</b>「津波で海へ」の危うさに気づけたのは、コードではなく防災の理解だった</div>
<div class="box accent"><b>② 良いデータを用意する</b>オープンデータを使える形に整える。ここで品質が決まった</div>
<div class="box accent"><b>③ 何を解くかを決める</b>「動く」より「間違えない」。問いを立て直し、確かめ続けた</div>
<div class="box good"><b>＝ 実装の速さはAIに任せた</b>自分は、この3つに集中していた</div>
</div>

---

## 後で知って、腑に落ちたこと

Anthropic（Claudeの開発元）も、近いことを言っていた。

<div class="grid2">
<div class="box accent"><b>「自分が何を知らないか」を明確にするほどAIは活きる</b>問い直すほど答えの質が上がった、と重なる</div>
<div class="box warn"><b>「地図は現地ではない」</b>指示とAIの理解にはズレがある → 触って初めて気づいた、と重なる</div>
</div>

<p class="sub" style="margin-top:16px">自分の手探りが、公式の説明と重なっていた。<br><small>参考：ナレッジセンス「Fable時代のAI活用法を、Anthropicの開発者が公開」(Zenn)</small></p>

---

## この資料も、AIと一緒に作った

- Marp ＝ スライドを **文章（テキスト）で書く** 方法
- だから **AIが読めて、直せる**。Git で変更も管理できる

<div class="box accent">
「テキストで伝える → AIが形にする」時代に、<strong>資料もテキストで持てる</strong>のは相性がいい。<br>（凝ったデザインで見せるなら、Canva等が今も有利）
</div>

---

## うまくいかなかったこと

- 動いて見えて、裏で **偽データや誤った順位** が潜んでいた
- データの入手と変換で、**何度もつまずいた**
- 「見た目が良くない」を直すのが難しかった（**良さを言葉にできず**、作り直しが続いた）

---

<!-- _class: msg -->

<p class="punch">AIは、速く形にする相棒。<br>ただ、<span class="mk">舵を握るのは人</span>。</p>

<p class="sub">一番の収穫は、成果物そのものよりも<br>「どこを自分がやるべきか」が見えたこと。</p>

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
