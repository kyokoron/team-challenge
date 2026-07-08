---
marp: true
paginate: true
title: 私が確かめたかったこと — 無料・静的で「役立つ避難案内」は作れるか
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
.q { font-size: 1.2em; color: #123f45; font-weight: 700; line-height: 1.5; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px; }
.box { border-radius: 10px; padding: 14px 18px; font-size: .92em; }
.box b { display:block; margin-bottom: 3px; }
.box.warn { background: #f8ede6; border: 1px solid #eecebb; color: #8f3d10; }
.box.good { background: #e9f2ec; border: 1px solid #cbe3d5; color: #1f6b46; }
.box.accent { background: #e9efed; border: 1px solid #cdddda; color: #123f45; }
.flow { display:flex; align-items:center; gap:10px; justify-content:center; margin-top:18px; flex-wrap:wrap; }
.flow .n { background:#fff; border:1.5px solid #cdddda; border-radius:10px; padding:12px 16px; font-size:.82em; text-align:center; }
.flow .a { color:#8aa; font-size:20px; }
.verdict { background:#e9f2ec; border:1px solid #cbe3d5; border-radius:10px; padding:10px 16px; margin-top:14px; color:#1f6b46; font-weight:600; }
.chain { display:flex; flex-direction:column; gap:5px; margin:8px 0; align-items:stretch; }
.chain span { background:#fff; border:1.5px solid #cdddda; border-radius:8px; padding:7px 10px; font-size:.8em; text-align:center; }
.chain .ar { border:none; background:none; color:#93a6a4; padding:0; font-size:.78em; }
.vc { background:#123f45; color:#fff; border-radius:8px; padding:9px 12px; margin-top:8px; font-weight:600; font-size:.86em; }
.vc.old { background:#e9efed; color:#123f45; border:1px solid #cdddda; }
section.title { background: #123f45; color: #fff; justify-content: center; }
section.title h1 { color: #fff; font-size: 44px; margin-bottom:.1em; }
section.title h3 { color: #bcd3cf; font-weight: 500; }
section.title hr { border:none; border-top:2px solid #2f6b71; width:80px; margin:24px 0; }
section.section { background: #123f45; color: #fff; justify-content: center; }
section.section h2 { color:#fff; border:none; font-size:36px; }
section.section p { color:#bcd3cf; }
</style>

<!-- _class: title -->

# 私が確かめたかったこと

### 無料・静的サイトだけで「本当に役立つ避難案内」は自分で作れるのか

<hr>

開発メンバー勉強会 ／ 課題1：アプリケーションシステム作成
Kyoko Takazawa

---

## この発表は「問い」から始まります

「すごいものを作りました」報告ではありません。
**個人的に確かめたいこと**があって、それを軸に作りました。

<div class="box accent" style="margin-top:18px">
<b>出発点になった2つの実感</b>
① 既存のハザードマップは情報が多く、いざという時<b>「で、今どこへ逃げれば？」に即答してくれない</b><br>
② 災害アプリなのにサーバ頼み…でも<b>被災時は通信が落ちる</b>。お金もかけたくない。
</div>

<p class="q" style="margin-top:22px">
問い：お金もサーバもかけず、<u>無料・静的</u>だけで、<br>
「今どこへ逃げれば安全か」を即答する<u>"役立つ"避難案内</u>は作れるのか？
</p>

---

## 作ったもの（問いを試すための題材）

<div class="cols">
<div>

**災害時避難シミュレーター**
災害種別に応じて、避難所とルートを提案する Web アプリ

- 地震／津波／台風／洪水／土砂で提案が変わる
- 危険区域（浸水域）を避けるルート
- オフライン対応・OIDC認証・HTTPS

</div>
<div>

🔗 https://kyokoron.github.io/team-challenge/
（完全無料・GitHub Pages）

<div class="box accent">
以降、このアプリを通して「無料・静的で役立つものは作れたか」を検証していきます。
</div>

</div>
</div>

---

<!-- _class: section -->

## 検証 ①
「災害時に本当に役立つか」を確かめる

---

## 「役立つ」を作ろうとして、逆に怖くなった

動くものはすぐできた。でも**触ってみて危うさに気づいた**。
避難案内は、間違えると命に関わる。

<div class="grid2">
<div class="box warn"><b>内陸で「津波」を選ぶと海へ8km誘導</b>指定避難所が沿岸に偏在 → 逆方向は致命的</div>
<div class="box warn"><b>架空のサンプルデータが出得た</b>取得失敗時に"偽の避難所"を表示する余地</div>
<div class="box warn"><b>"最寄り"が最寄りでない</b>広域データで距離が正規化され順位が崩れる</div>
<div class="box warn"><b>直線距離を「徒歩◯分」表示</b>川や線路で実際は遠い＝過小表示で油断を生む</div>
</div>

<p class="lead" style="margin-top:14px">「役立つ」の前に、まず「間違えない」だった。</p>

---

## 気づき：「安全側に倒す」まで作って初めて"役立つ"

![bg right:34%](img/danger.png)

- 対象外の地点は遠くへ誘導せず **「垂直避難を」と警告**
- **偽データを完全排除**（取れなければ正直に止める）
- **現在地が浸水域内なら最優先で警告**（右図）
- 直線距離は**「実際の道のりは異なります」と正直に**表示
- できないこと（危険の完全自動回避は不可 等）も**明示**

<div class="verdict">検証①の答え：役立つものは作れる。ただし "役立つ" の中身は「間違えない設計」だった。</div>

---

<!-- _class: section -->

## 検証 ②
「無料・静的の限界」を確かめる

---

## サーバなしは"制約"のはずが、思想と噛み合った

![bg right:33%](img/offline.png)

- 災害アプリの本質＝**通信が落ちる瞬間に使える**こと
- サーバDBは「その瞬間に頼れない」→ **静的配信＋端末保存が理にかなう**
- **オフライン(PWA)**：一度見た地域は IndexedDB に保存、**圏外でも検索可**
- **OIDC認証(Auth0)** を **バックエンドなし**（PKCE）で実現
- **浸水域を避けるルート**（ORSの`avoid_polygons`）
- すべて **GitHub Pages（静的・無料・HTTPS）**

> 「無料・静的」は妥協ではなく、**この題材にはむしろ正解**だった。

---

## もちろん限界もあった（正直に）

<div class="grid2">
<div class="box good"><b>できた</b>避難所ランキング／浸水回避ルート／オフライン検索／認証／HTTPS を、サーバ0円で</div>
<div class="box warn"><b>できなかった・限界</b>リアルタイム更新・混雑や通行止め・全国全ハザードの即時反映は、静的だけでは無理</div>
</div>

<div class="box accent" style="margin-top:14px">
学び：本当に全国運用するなら「平常時にサーバで整えて、端末に配って被災時に使う」<b>ハイブリッド</b>が現実解。無料・静的は<b>"個人が価値を検証する"段階には十分すぎる</b>。
</div>

<div class="verdict">検証②の答え：無料・静的で"実用的な核"は作れる。限界の線も、作ってみて初めてはっきり引けた。</div>

---

## 両方の土台：オープンデータのリアル

- 避難所・標高・ハザードは **国のオープンデータで揃う**（無料・商用可も）
- が、実際に使うと…
  - どれが正解のデータか **分かりにくい**（避難所は複数種別）
  - 洪水浸水想定(A31)は **河川単位**で「東京の1ファイル」が無い
  - **Shapefile** が多く、GeoJSON化・座標変換・簡略化の前処理が要る
  - ルートAPI(ORS)は **回避ポリゴンに上限**があり工夫が必要

<div class="box good">
「データはある」と「すぐ使える」は別物。<b>整形・前処理が実装と同じくらい重い</b>と痛感した。
</div>

---

<!-- _class: section -->

## 補足：手段として使った「AI開発」の所感

---

## AIで作ってみて — 速いが、丸投げは危ない

この検証、**Claude Code と対話しながら**進めた。課題2・3(AI開発)にも通じる所感：

| AIが得意 | 人間の判断が必要 | 危なかった点 |
|---|---|---|
| 叩き台の高速生成 | 何を・なぜ作るか | "それっぽく動く"が正しくない |
| データ変換・前処理 | 安全・倫理の線引き | 偽データfallbackを平然と残す |
| CSS/UI調整の反復 | 優先順位づけ | 誤ランキングに気づかない |
| 定型実装・リファクタ | 「この挙動おかしい」の指摘 | レビューを怠ると事故 |

<p class="lead">前述の"危うさ"は全て、私が触って指摘して直した。<b>速度はAI、判断とレビューは人</b>。</p>

---

## AI時代、プロダクトの「価値の中心」が動く

<div class="cols">
<div>

<h3>従来</h3>
<div class="chain"><span>ユーザー</span><span class="ar">↓ UIを操作</span><span>UI（アプリ）</span><span class="ar">↓</span><span>機能（ロジック）</span><span class="ar">↓</span><span>データ</span></div>
<div class="vc old">価値の中心：UI設計・機能開発・実装</div>

</div>
<div>

<h3>AI時代</h3>
<div class="chain"><span>ユーザー</span><span class="ar">↓ 目的を伝える</span><span>AI（理解・推論）</span><span class="ar">↓</span><span>データ</span></div>
<div class="vc">価値の中心：① ドメイン理解　② 良いデータ　③ 何を解くべきか</div>

</div>
</div>

<p class="lead" style="margin-top:16px">コードを書くことよりも、<b>「何を解くべきか」</b>の方が重要になる。</p>

---

## 今回、私の「価値の中心」も そこだった

図の3つは、まさに**今回の私が握っていた部分**だった。

<div class="grid2">
<div class="box accent"><b>① ドメイン理解</b>防災の安全要件。「津波で海へ誘導」の危うさに気づけたのは、コードではなく人の理解</div>
<div class="box accent"><b>② 良いデータ</b>国のオープンデータを"使える形"に整える前処理が、品質を大きく左右した</div>
<div class="box accent"><b>③ 何を解くべきか</b>「動く」より「間違えない」。問いを立て直し、レビューし続けた</div>
<div class="box good"><b>＝ 実装の速さはAIに任せ</b>私はこの3つに集中していた（と、後から気づいた）</div>
</div>

---

## 余談：この資料も Markdown（Marp）で作った

- スライドを **文章（テキスト）で書く** ツール。図を並べる代わりに、構造を文字で書く
- なぜ AI 時代に相性がいい？
  - **AIが読める・書ける・直せる** ―「ここ直して」で即反映（この資料が現にそう）
  - **Git で差分管理** できる＝スライドをコードと同じように扱える
  - **中身とデザインが分離**（テーマは固定、中身だけ高速に直せる）
- パワポのように1枚ずつ手で整えるより、**中身の議論に集中**できた

<div class="box accent">
所感：AI時代は「テキストで伝える → AIが形にする」が中心。<b>スライドもテキストで持てるMarpは、その波に乗りやすい</b>。ただし作り込んだビジュアル勝負なら、Canvaや従来ツールが今も有利。
</div>

---

## 苦労・失敗したこと

- 動いて見えて、裏で **"偽データ・誤順位"** が潜んでいた
- データ入手・変換で何度もつまずいた（河川単位・Shapefile・API制限）
- 認証やオフラインは **一度で動かず**、原因切り分けを繰り返した
- 「見た目が微妙」を直すのが一番難しい（**"良い"の言語化**が難しく作り直し多数）

<div class="box accent">
失敗の多くは「動かして初めて分かる」もの。<b>触る→気づく→直す</b>の反復が、結局いちばん効いた。
</div>

---

## まとめ：問いへの答え

<p class="q">Q. 無料・静的だけで「役立つ避難案内」は作れるか？</p>

- **A. 作れる。** ただし "役立つ" の正体は機能の多さではなく **「間違えない設計」** だった
- **無料・静的** は妥協ではなく、被災時に使うという **思想と噛み合えば強み**。限界の線も自分で引けた
- **オープンデータ**は宝の山だが、**前処理という現実**がある
- **AI**で速度は劇的に上がる。でも **"正しさ・安全"を問い続けるのは人**の仕事

<p class="lead">作って一番の収穫は、成果物そのものより「どこを自分が握るべきか」が分かったこと。</p>

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
