---
marp: true
paginate: true
title: AIを使った開発の知見共有
---

<style>
section {
  font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, "Noto Sans JP" sans-serif;
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
.note { color: #5c5a54; font-size: .84em; margin-top: 1em; line-height: 1.7; }
.chain { display:flex; flex-direction:column; gap:5px; margin:4px 0; align-items:stretch; }
.chain span { background:#f4f6f5; border:1px solid #cdddda; border-radius:6px; padding:6px 10px; font-size:.62em; text-align:center; }
.chain .ar { border:none; background:none; color:#93a6a4; padding:0; font-size:.58em; }
.vc { background:#123f45; color:#fff; border-radius:6px; padding:8px 12px; margin-top:9px; font-weight:600; font-size:.62em; }
.vc.old { background:#eef1f0; color:#123f45; border:1px solid #cdddda; }
.cols.vcols { align-items: stretch; }
.vcols > div { display:flex; flex-direction:column; }
.vcols .vc { margin-top:auto; }
.bug { background:#fdf3f2; border:1px solid #e6c9c5; border-radius:8px; padding:10px 16px; margin:.5em 0; font-size:.88em; }
.bug b { color:#8c3a30; }
.fix { background:#f1f6f4; border:1px solid #c8ddd6; border-radius:8px; padding:10px 16px; margin:.5em 0; font-size:.88em; }
.fix b { color:#1c5b63; }
.kpi { display:flex; gap:18px; margin:.4em 0 .2em; }
.kpi > div { flex:1; background:#f4f6f5; border:1px solid #cdddda; border-radius:10px; padding:14px 10px; text-align:center; }
.kpi .n { font-size:1.5em; font-weight:700; color:#123f45; display:block; }
.kpi .l { font-size:.62em; color:#5c5a54; }
section.title { background: #123f45; color: #fff; justify-content: center; }
section.title h1 { color: #fff; font-size: 44px; margin-bottom:.15em; }
section.title h3 { color: #bcd3cf; font-weight: 500; }
section.title hr { border:none; border-top:1px solid #3a6d72; width:70px; margin:22px 0; }
</style>

<!-- _class: title -->

# AIを使った開発の知見共有

### 防災アプリの制作を題材に — 「注意する」から「仕組みで防ぐ」へ

<hr>

開発メンバー勉強会 ／ 課題1
Kyoko Takazawa

---

## 発表内容

- テーマ：**AIを使った開発で得た知見の共有**
- 題材：防災アプリ（成果物紹介が目的ではない）

- 一番伝えたいこと

> **AIの誤りは「気をつける」では防げない。**
> **どう仕組みで捕まえるかが、人の仕事になる。**

- 流れ：題材 → 進め方 → 事例の深掘り → 知見 → 次にやること

---

## 題材：作ったアプリ

- 災害時に、避難所と避難ルートを提案する Web アプリ
- 災害種別で提案が変わり、危険な区域を避けて案内

<div class="kpi">
<div><span class="n">約6時間</span><span class="l">総開発時間</span></div>
<div><span class="n">100%</span><span class="l">AIが書いたコードの割合</span></div>
<div><span class="n">8件</span><span class="l">発見した誤動作（うち危険なもの4件）</span></div>
</div>

<p class="note">公開URL：https://kyokoron.github.io/team-challenge/</p>

---

## 開発の進め方

- AI（Claude Code）と対話しながら開発。**コードはAI、要件・レビュー・判断は人間**
- 環境構築は不要、すべてブラウザで完結
  <small>（ブラウザ版 VS Code ＋ GitHub の静的サイト）</small>
- 「対話」といっても、**渡す文脈の設計**で結果が大きく変わる
  - プロジェクトの前提・規約をファイル化し、毎回AIに読ませる
  - 曖昧な指示 →「もっともらしい間違い」／制約を先に文章化 → 手戻り減
- なお、**この発表資料もMarkdown（Marp）でClaudeに作らせたもの**

<p class="note">プロンプトの言い回しより、「AIに何を前提として渡すか」の設計が効く。</p>

---

## 事例：AIが生んだ「危険な」バグ


<div class="bug"><b>① 内陸で「津波」を選ぶと、海側へ誘導</b><br>災害種別が距離計算に反映されず、単純な最寄り検索になっていた</div>
<div class="bug"><b>② データ取得に失敗すると、実在しない避難所を表示</b><br>フォールバックとしてAIが「例示用のダミーデータ」を勝手に用意していた</div>
<div class="bug"><b>③ 距離計算が狂い、最寄り順が崩壊</b><br>緯度経度の扱いを誤った、もっともらしい計算式が紛れていた</div>

<p class="note">3つとも、デモ操作の「動作確認」はすり抜けた。</p>

---

## 深掘り：バグ① なぜ起きたか

原因はAIの能力ではなく、**人間側の指示**。

<div class="cols">
<div>
<div class="bug"><b>実際の指示</b><br>「現在地から近い避難所を提案して」<br><br>→ AIは指示どおり、距離だけで選ぶ実装を作成。<b>曖昧な要件が、曖昧なまま実装された</b></div>
</div>
<div>
<div class="fix"><b>渡すべきだった要件</b><br>「災害種別ごとに安全条件が変わる。<b>津波時：現在地より標高が高い避難所のみ。洪水時：浸水想定区域内の避難所は除外</b>。そのうえで近い順」</div>
</div>
</div>

<p class="note">「近い」の一言に、災害種別ごとの安全条件が暗黙に含まれていた。<br>この暗黙知の言語化が今後開発に必要なスキルになる気がします！</p>

---

## 深掘り：バグ① 何なら防げたか

「気をつけてレビュー」ではなく、**安全条件をテストに翻訳する**。

<div class="fix"><b>不変条件 → そのままテストケースになる</b><br>
・内陸5地点 ×「津波」→ 提案先すべての標高 ＞ 現在地の標高（バグ①を検知）<br>
・避難ルートの全区間 × 浸水想定ポリゴン → 交差ゼロ（ルートの安全性）<br>
・データ取得を強制失敗 → 提案を出さず「取得失敗」を表示（バグ②を検知）<br>
・既知の2地点間の距離 ＝ 地図上の実測値 ±1%（バグ③を検知）</div>

- テスト自体も**AIに書かせられる**。人の仕事は条件を決めること
- 実際、バグ発見後にこの形の検証を追加 → 修正確認が一瞬に



---

## 知見① 「問い返す」より「条件を先に置く」

- 「本当にそうか？」という問い返しは有効。ただし**思いついた時しか機能しない**
- 効いたのは、疑う前に**選択肢と条件を列挙させる**こと

<div class="cols">
<div>
<div class="bug"><b>起きたこと</b><br>「DBが必要なのは投稿・更新のときだけ」とAIが断定 → 危うく鵜呑みに</div>
</div>
<div>
<div class="fix"><b>効いた聞き方</b><br>「この判断が変わる条件を3つ挙げて」<br>→ オフライン利用・更新頻度・認証との関係が浮上し、設計を変更</div>
</div>
</div>

<p class="note">属人的な「注意力」ではなく、判断の前に条件を吐き出させる「聞き方の型」に。<br>型なら、誰がやっても再現できる。</p>

---

## 知見② データ整備：残る仕事と、消せる仕事

- コード生成は一瞬。しかし今回、**時間の約2割はデータとの格闘**
- 実際にぶつかった壁と、その分担：

| ぶつかった壁 | 人がやったこと | AIに任せたこと |
|---|---|---|
| 浸水想定（A31）が県単位のGISデータ | どの区域を使うか判断 | 形式変換スクリプト |
| 避難所データの形式・項目が不揃い | 「正」とする項目の決定 | 整形・結合スクリプト |
| ダミーデータ事故（バグ②） | 検証ルールの決定 | 検証スクリプト実装 |

- 検証ルールの例：**件数 > 0／座標が日本域内／必須項目の欠損ゼロ**

<p class="note">「整形はAI・判断と検証基準は人」と最初から分担を決めれば、この2割はもっと圧縮できた。</p>

---

## 知見③ 人の時間は、すでに「実装」に使われていない

<div class="cols vcols">
<div>

<h3>今回の自分の時間の使い方（実測）</h3>

- 要件の言語化・指示：約45%
- 出力のレビュー・検証：約35%
- データの確認・整備：約20%
- 自分でコードを書く：約0%

</div>
<div>

<h3>構造の変化</h3>
<div class="chain"><span>ユーザー</span><span class="ar">↓ 目的を伝える</span><span>AI（理解・推論）</span><span class="ar">↓</span><span>データ</span></div>
<div class="vc">価値の中心：ドメイン理解・データ整備・課題設定・検証設計</div>

</div>
</div>

<p class="note">「実装からの解放」は未来予想ではなく、数時間の個人開発で実測できる現実。</p>

---

## もう一度やるなら、こうする

1. **安全条件のチェックリストを最初に作る**（防災なら：誘導方向・標高・浸水域・データ鮮度）
2. **テストを実装より先にAIに書かせる**（条件→テスト→実装の順）
3. **データ検証スクリプトを初日に用意する**（件数・範囲・出所のチェック）
4. プロジェクトの前提・規約は**最初にファイル化してAIに常時読ませる**
5. 「動いたら完成」ではなく「**どの条件を検証済みか**」で進捗を測る

<p class="note">この5つは、次の開発でそのままテンプレートとして使える。</p>

---

## この知見の射程（限界）

- 今回は**数時間・個人・使い捨てに近いコード**での知見
- チーム開発・長期保守では、別の課題が出るはず
  - 複数人がAIを使うときの**コード品質の均質化**とレビューコスト
  - AIに与える**権限の設計**（何を自動承認し、何を止めるか）
  - 生成コードの**保守性・監査**の問題
- 「個人の生産性ツール」から「チームのインフラ」に変わる境目で、
  何を整備すべきか——次に検証したい問い

---

## まとめ

- AIで開発速度は大きく上がる。**ここはもう議論の段階ではない**
- 差がつくのは、誤りを「注意」ではなく**仕組みで捕まえる設計**
  - 安全条件の言語化 → テスト化 → 人は条件の漏れを見る
- データ整備・課題設定・検証設計——**人が担う工程の比重が増す**
- 「何を・正しく作るか」を**検証可能な形で定義する力**が、これからの実装力
  <small>（アプリも、この資料も、コードとMarkdownはAI）</small>

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