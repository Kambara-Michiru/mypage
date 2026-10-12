# 神原みちる｜Michiru Kambara

**AI・認知科学・デザインを横断する個人ポートフォリオサイト。**

> 理論からAIの仕組みを学びつつ、人文学としてのAI理解も含めて、テクノロジーと幸せに生きる方法を横断的に模索しています。認知心理学と情報工学のあいだで、学際的に探究中。

🔗 **Live:** _（公開URLを設定したらここに記載）_

---

## プロフィール

- **京都大学 総合人間学部 認知情報学系** 在籍 — 熊田–中島研究室（心理情報学／AIとの意思決定）
- **2025年秋〜 ワシントン大学** College of Arts & Sciences へ交換留学
- 卒業研究：**意思決定におけるAIからのアドバイス受容**（人はいつAIの助言を受け入れ、いつ退けるのか）
- **京都大学人工知能研究会（KaiRA）** 所属（2024〜）— RAG・エージェントAIの実験・実装
- 競技ディベート（WUDC 世界大会に京都大学代表として出場）／バスケットボール13年

掲載内容（サイト内セクション）:

| セクション | 内容 |
|---|---|
| **About** | 自己紹介・写真・卒業論文フィーチャー |
| **Work** | プロダクト／プロジェクト（ActBuddy, Osarai GO など） |
| **Media** | 登壇・寄稿・Podcast などの掲載 |
| **Writing** | note / Medium の記事 |
| **Books** | 影響を受けた本 |
| **Contact** | 連絡先・SNS リンク |

---

## このリポジトリについて

このサイトのソースコードです。本体は素の HTML / CSS / JavaScript のままで、WebGL エフェクトだけを Vite でビルドして差し込んでいます（詳しくは「エフェクト層」）。

### ファイル構成

```
mypage/
├── index.html        # 本体（1ページ・全セクション）
├── styles.css        # デザイントークン + スタイル
├── system.css        # 素材のルール（紙・光・ガラス）で見た目をそろえる層
├── script.js         # JA/EN切替・スクロールフェード・モバイルメニュー
├── src/effects/      # WebGL エフェクト（ヒーローの光・ガラス・ロボット、3D）
├── src/vendor/       # liquid-glass-js（同梱）
├── vite.config.ts    # ビルド設定（既存ファイルはそのまま dist にコピー）
├── assets/           # favicon / OGP（favicon.svg, apple-touch-icon.png, ogp.png/svg）
├── images/           # debating_me.jpeg（About の写真）
└── pdf/              # 配布資料（KaiRA会誌 2024/2025・発表スライド）
```

### 主な仕様

- **言語切替（JA / EN）**: `data-ja` / `data-en` 属性を JS で切替え、`<html lang>` も更新。選択は `localStorage` に保存し、初回はブラウザ言語から判定。
- **レスポンシブ**: モバイルファースト。760px 以下でハンバーガーメニュー。
- **モーション**: スクロールに合わせた控えめなフェードイン（IntersectionObserver）。`prefers-reduced-motion` を尊重して無効化。
- **写真**: ホバーでズーム、クリックでライトボックス拡大（背景クリック／×／Esc で閉じる）。
- **アクセシビリティ**: セマンティック HTML、skip リンク、`aria-*`、フォーカスリング。
- **メタ**: OGP / Twitter Card / favicon / apple-touch-icon 設定済み。

### デザイン

コンセプトは **「書斎の窓辺」** — 紙とインクの落ち着きに、午後の光の暖かさを足す。
配色・タイポは `styles.css` の `:root`（デザイントークン）で一元管理。

| 役割 | 値 |
|---|---|
| ベース／サブ背景 | `#FAF6F0` / `#F3ECE2` |
| テキスト／補助 | `#2B2520` / `#5A5147`（補助色は WCAG AA 準拠まで調整） |
| アクセント | `#C96F4A`（テラコッタ） |
| 補助色 | `#6E8499`（くすみブルー） |
| 罫線 | `#E0D7CA` |

見出し: Noto Serif JP / Source Serif 4 ・ 本文: Zen Kaku Gothic New / Inter（Google Fonts）

### 素材のルール：紙・光・ガラス（`system.css`）

見た目の言語をそろえるため、すべての要素を3つの素材のどれかに属させています。

| 素材 | 使う場所 | 決まりごと |
|---|---|---|
| 紙 | 文章・カード | 平ら・細い罫線・影なし。角丸 16px（写真は 12px、タグはピル） |
| 光 | 背景の雰囲気 | 淡いテラコッタ `#EDB396` とくすみブルー `#B7C5D2` の、ぼけた光の玉だけ。動かない。ヒーローの光は下端で紙へにじむ |
| ガラス | 応えてくれるもの（ヒーローのナビ・メニュー・「これから」の3D） | 影はここだけ（インクブラウン系） |

- 光源はいつも左上（書斎の窓）。ロボット・3D・光の明るい側をそろえる。
- ページ全体にごく薄い紙の粒子（3〜5%）を敷き、ヒーローの光の粒子と質感をそろえる。
- ロボットは1体のキャラクター：横長の頭・丸い目・短い眉・ほっぺ。ヒーロー（3D）、卒業研究（線画）、「これから」（ガラス）に同じ顔で登場する。
各セクションにはインライン SVG の装飾レイヤー（`.deco`）を配置。`aria-hidden`・`pointer-events:none`・背面固定のため可読性と操作性には影響しません。

---

## 設計の工夫（情報設計）

このサイトは「作品を並べる場所」ではなく、見る人の知覚・認知特性を活かして理解を助ける **情報可視化そのもの** として設計しています（ビジュアルインターフェイス／GUI／情報可視化の知見を反映）。

- **Overview-first（Shneiderman のマントラ）** — ヒーローに概観アンカー「見る：研究／AI・開発／メディア／執筆」を置き、スクロール前に全体像と探索導線を提示。各アンカーは **Fisheye**（焦点に近い項目ほど拡大。Furnas の DOI＝関心度−距離 の直感）で反応。
- **Focus + Context** — 最上部の細いスクロール進捗バーで「今どこ・あとどれくらい」を常時提示。ヘッダーの scrollspy が現在セクションを `aria-current` でハイライト。
- **前注意過程（preattentive）** — 常時動く装飾はヒーローのみに限定し、各画面の焦点を見出しへ。強調は色・サイズで一画面に最小限。
- **Show, don't tell（数字より絵で語る）** — 専門性を「認知科学 × 情報科学 ＝ 心理情報学」の概念図に。強みは3本の“横糸”で合流するダイアグラム、研究の歩みは「画面 → 空間」のスクロール物語で提示。さらに **「私を構成する要素」フォースグラフ**（自前Verlet＋SVG・21ノードを5カテゴリで・ドラッグ/ホバー/クリック）と、**エッセイのワードクラウド**（note・Medium本文の頻出語を頻度に応じた大きさで）。
- **メタファ／ゲシュタルト** — 馴染みのあるカード・タイムライン・グリッドで操作を学ばせない。近接・整列で「関連＝近く／別＝余白」を一貫。
- **WYSIWYG・一貫性** — ナビのラベルと遷移先を一致させ、PC/スマホで表示を統一。
- **アクセシビリティ** — 色だけに頼らない（scrollspy は太字＋下線も併用）、本文/補助色のコントラストを AA 準拠に調整、装飾 SVG は `aria-hidden`、`prefers-reduced-motion` で演出を停止。

> 実装の対応箇所：概観アンカー＆Fisheye=`index.html .hero-explore` / `script.js`、進捗バー=`.scroll-progress`、scrollspy=`script.js`、概念図=`.concept`、強みの横糸=`.strength-flow`、研究の歩み=`#vision`、フォースグラフ=`#network`（`script.js` 末尾のIIFE）、ワードクラウド=`.wordcloud`。

---

## エフェクト層（2026年10月リニューアル）

ページの中身・構成・情報設計はそのままに、WebGL のエフェクトを「島」として後から差し込んでいます。
WebGL が使えない環境では何も差し込まず、これまでどおりのページが表示されます。

| 場所 | ライブラリ | 何を表しているか | コード |
|---|---|---|---|
| ヒーローのロボット | [three.js](https://threejs.org/examples/#webgl_animation_skinning_morph) + R3F（RobotExpressive：Tomás Laulhé／Quaternius、改変 Don McCurdy、CC0） | あいさつするロボット。手を振る・カーソルを目で追う・ナビに合わせてうなずく／グッド／ジャンプ・画面外でさみしい顔。ヒーローを離れると右下のすりガラスの台に小さく移り、ずっとそばにいる（スクロール中は薄くなり、スクロールの速さに合わせていっしょに歩く。「これから」では3Dを見守る、クリックでページ先頭へ、連絡先で手を振る）。色はピーチとミルクにして、ほっぺを足した | `src/effects/HeroRobot.tsx` |
| ヒーロー背景 | 自作シェーダー（素の WebGL） | 縦溝ガラス（フルーテッドガラス）越しの光。ピーチ・テラコッタ・くすみブルーの光がゆっくり漂い、畝ごとに像が反転して、光の点にだけ細い反射の筋が走る。カーソルの光がついてくる | `src/effects/HeroLight.tsx` |
| ヒーローの「見る」ナビ | [liquid-glass-js](https://github.com/dashersw/liquid-glass-js) | 光を屈折するガラス。本物の `<a>` リンクをそのまま中に入れている | `src/effects/heroGlass.ts` |
| これから — 画面から、空間へ | [React Three Fiber](https://github.com/pmndrs/react-three-fiber) + drei | スクロールに合わせて「画面（薄い板）→ からだ → 目（視線）→ 内側の灯」へ変わるガラス | `src/effects/VisionScene.tsx` |

- ロボットのモデルは `src/effects/assets/robot.glb`（約460KB）。ヒーローの文字が出たあとに読み込む。
- 入口は `src/effects/main.tsx`。3D シーンは画面に近づいてから読み込む（初回表示を軽く保つ）。
- `prefers-reduced-motion` のときはグラデーションとロボットのしぐさを止め、スクロール連動だけ残す。
- liquid-glass-js は npm 配布が無いため `src/vendor/liquid-glass.js` に同梱（MIT、`src/vendor/LIQUID-GLASS-LICENSE.txt`）。本家はページを html2canvas で撮影するが、ここでは動くグラデーションを毎フレーム直接テクスチャに流し込んでいる。
- `three` は `0.169.0` に固定（以前 ShaderGradient が想定していた版）。`@shadergradient/react` は今は使っていないので、次に依存を整理するときに外してよい。

## ローカルで動かす

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/ に本番用ファイル
npm run preview    # ビルド結果の確認
```

Node.js 20 以上。

## GitHub Pages へのデプロイ

ビルドが必要になったので、GitHub Actions でデプロイします（`.github/workflows/deploy.yml`）。

1. **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に変更（以前の「Deploy from a branch」から切り替え）。
2. `main` に push すると自動でビルド・公開されます。
3. `https://<username>.github.io/mypage/` で公開（`vite.config.ts` の `base: './'` によりサブパスでもそのまま動きます）。

> 公開URLを確定したら、`index.html` の `<link rel="canonical">` と OGP の `og:image`（現状 `https://example.github.io/` のプレースホルダ）を実URLに更新してください。
