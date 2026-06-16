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

このサイトのソースコードです。ビルド不要の静的サイト（素の HTML / CSS / JavaScript）で、そのまま GitHub Pages に置けます。

### ファイル構成

```
mypage/
├── index.html        # 本体（1ページ・全セクション）
├── styles.css        # デザイントークン + スタイル
├── script.js         # JA/EN切替・スクロールフェード・モバイルメニュー
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
| テキスト／補助 | `#2B2520` / `#6B6258` |
| アクセント | `#C96F4A`（テラコッタ） |
| 補助色 | `#6E8499`（くすみブルー） |
| 罫線 | `#E0D7CA` |

見出し: Noto Serif JP / Source Serif 4 ・ 本文: Zen Kaku Gothic New / Inter（Google Fonts）
各セクションにはインライン SVG の装飾レイヤー（`.deco`）を配置。`aria-hidden`・`pointer-events:none`・背面固定のため可読性と操作性には影響しません。

---

## ローカルプレビュー

```bash
cd mypage
python3 -m http.server 4173
# → http://localhost:4173
```

## GitHub Pages へのデプロイ

1. GitHub リポジトリとして push（例: `username/mypage` または `username.github.io`）。
2. **Settings → Pages → Build and deployment → Source** を **Deploy from a branch** に設定。
3. **Branch** を `main` / `/ (root)` にして **Save**。
4. 数分後 `https://<username>.github.io/<repo>/` で公開。

> すべて相対パスのため、サブディレクトリ公開でも追加設定は不要です。
> 公開URLを確定したら、`index.html` の `<link rel="canonical">` と OGP の `og:image`（現状 `https://example.github.io/` のプレースホルダ）を実URLに更新してください。
