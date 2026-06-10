# 神原みちる｜Portfolio

AI・認知科学・デザインを横断する個人ポートフォリオサイト。
コンセプトは **「書斎の窓辺」** — 紙とインクの落ち着きに、午後の光の暖かさを足す。

素の HTML / CSS / JavaScript による静的サイトで、ビルド不要。そのまま GitHub Pages に置けます。

## 構成

```
mypage/
├── index.html        # 本体（1ページ・全セクション）
├── styles.css        # デザイントークン + スタイル
├── script.js         # JA/EN切替・スクロールフェード・モバイルメニュー
├── assets/           # favicon / OGP
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   ├── ogp.png       # 1200×630
│   └── ogp.svg       # OGP編集用ソース
├── images/           # 写真（差し替え可）
│   ├── debating_me.jpeg
│   └── basketball_me.jpeg
└── pdf/
    └── kairaNF2025.pdf
```

## 主な仕様

- **言語切替（JA / EN）**: ヘッダー右上のトグル。各要素に `data-ja` / `data-en` 属性を持たせ、JS で切替＋`<html lang>` も更新。選択は `localStorage` に保存。初回はブラウザ言語から判定。
- **レスポンシブ**: モバイルファースト。760px 以下でハンバーガーメニュー。
- **モーション**: スクロール時の控えめなフェードイン（IntersectionObserver）。`prefers-reduced-motion` を尊重して無効化。
- **写真（About）**: ホバーでゆっくりズーム＋スタッガード表示。クリックでライトボックス拡大（背景クリック／×ボタン／Escで閉じる、開いている間は背景スクロールをロック）。
- **卒業論文フィーチャー（About）**: 概念を表すインラインSVGイラスト（人↔AIの助言フロー＋信頼を測る天秤）付きのカード。
- **影響を受けた本**: ネイティブ `<details>/<summary>` によるクリック開閉（JS不要・キーボード操作対応）。
- **アクセシビリティ**: セマンティックHTML、skipリンク、`aria-*`、フォーカスリング。
- **メタ**: OGP / Twitter Card / favicon / apple-touch-icon を設定済み。

## デザイントークン（`styles.css` の `:root`）

| 役割 | 値 |
|---|---|
| ベース | `#FAF6F0` |
| サブ背景 | `#F3ECE2` |
| テキスト | `#2B2520` |
| 補助テキスト | `#6B6258` |
| アクセント | `#C96F4A`（テラコッタ） |
| 補助色 | `#6E8499`（くすみブルー・装飾の塗り用） |
| 罫線 | `#E0D7CA` |

見出し: Noto Serif JP / Source Serif 4 ・ 本文: Zen Kaku Gothic New / Inter（Google Fonts）

### 装飾レイヤー（インラインSVG）
各セクションに有機ブロブ＋幾何モチーフ（リング・ドット）の装飾SVGを配置（`.deco` クラス）。色は `.blob-accent` / `.blob-blue` などのクラスでCSS変数を参照。`prefers-reduced-motion` でふわふわ浮遊・回転アニメは自動停止。装飾は `aria-hidden`・`pointer-events:none`・本文の背面（`z-index:0`）に固定しているため、可読性と操作性には影響しません。

## 差し替えガイド

### 画像（`images/`）
| ファイル名 | 用途 | 推奨サイズ |
|---|---|---|
| `debating_me.jpeg` | About／ディベート写真 | 横長 4:3（例 1600×1200） |
| `basketball_me.jpeg` | About／バスケ写真 | 横長 4:3（例 1600×1200） |

同名で上書きすればOK。`index.html` の `width` / `height` 属性も実寸に合わせると CLS を防げます。

### OGP画像（`assets/`）
`assets/ogp.svg` を編集 →`ogp.png`（1200×630）として書き出して差し替え。

### リンク（プレースホルダ）
`href="#"` かつ `data-placeholder` が付いた箇所が未確定リンクです。実URLに差し替え、`data-placeholder` 属性を外してください。該当箇所:

- ActBuddy の GitHub
- LFDA の note / Podcast
- note（プロフィール・「身体性」記事）
- Medium 2記事
- Footer の GitHub / note / Medium

確定済みリンク: KAIRA NF2025 PDF、Osarai GO（GitHub）、LFDA Website、Instagram、Email。

## ローカルプレビュー

ビルド不要。任意の静的サーバーで:

```bash
cd mypage
python3 -m http.server 4173
# → http://localhost:4173
```

## GitHub Pages へのデプロイ

### 方法A: リポジトリ直下を公開（最も簡単）

1. このディレクトリを GitHub リポジトリとして push（例: `username/mypage`、または `username.github.io`）。
2. GitHub の **Settings → Pages** を開く。
3. **Build and deployment** → **Source** を **Deploy from a branch** に設定。
4. **Branch** を `main` / `/ (root)` にして **Save**。
5. 数分後、`https://<username>.github.io/<repo>/`（または `https://<username>.github.io/`）で公開されます。

> サブディレクトリ公開（`/<repo>/`）でもすべて相対パス（`styles.css` 等）なので追加設定は不要です。
> `index.html` 内の `<link rel="canonical">` と OGP の `og:image` URL を実際の公開URLに更新してください。

### 方法B: GitHub Actions

特別なビルドは不要なので方法Aで十分ですが、Actions を使う場合は公式の「Static HTML」ワークフロー（Settings → Pages → Source: GitHub Actions）をそのまま利用できます。

---

© 2026 Michiru Kambara
