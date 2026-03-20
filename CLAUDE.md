# CLAUDE.md - Web Speed Hackathon 2026

## プロジェクト概要

CyberAgent主催のWebパフォーマンス最適化コンテスト。架空のSNS「CaX」を高速化する競技。
Lighthouse による採点: ページ表示 900点 + ページ操作 250点 = **1150点満点**。

## 技術スタック

- **フロントエンド**: React 19 + Redux + React Router 7 + Webpack 5 + Babel 7 + Tailwind CSS 4
- **バックエンド**: Express 5 + Sequelize 6 + SQLite3 + tsx
- **言語**: TypeScript 5.9
- **パッケージマネージャ**: pnpm 10.32.1 (Node.js 24.14.0, mise で管理)
- **リンター**: oxlint + oxfmt
- **デプロイ**: Fly.io (Docker, nrt リージョン)
- **計測**: Lighthouse 12 + Playwright + Puppeteer

## ディレクトリ構成

```
/application/
├── client/          # React フロントエンド
│   ├── src/
│   │   ├── index.tsx       # エントリーポイント
│   │   ├── index.css       # Tailwind CSS (@import "tailwindcss")
│   │   ├── components/     # React コンポーネント (89ファイル)
│   │   ├── containers/     # Redux コンテナ
│   │   ├── hooks/          # カスタムフック
│   │   ├── store/          # Redux ストア
│   │   └── utils/          # ユーティリティ
│   ├── webpack.config.js   # Webpack設定 (※意図的に最適化無効)
│   ├── babel.config.js     # Babel設定 (※IE11ターゲット)
│   └── postcss.config.js   # PostCSS + Tailwind
├── server/          # Express バックエンド
│   ├── src/
│   │   ├── index.ts        # エントリーポイント (ポート: dev=3000, prod=8080)
│   │   ├── app.ts          # Express アプリケーション
│   │   ├── models/         # Sequelize モデル (13テーブル)
│   │   ├── routes/         # APIルート
│   │   └── seeds.ts        # シード挿入
│   ├── seeds/              # JSONL シードデータ
│   └── openapi.yaml        # API仕様
├── public/          # 静的アセット (365MB: 画像89MB, 動画179MB, フォント12.6MB)
└── dist/            # ビルド出力
/scoring-tool/       # 計測・採点ツール (Lighthouse + Playwright)
/docs/               # レギュレーション、採点方法、テストケース
```

## コマンド

```bash
# 環境セットアップ (mise でNode/pnpm管理)
mise install

# 依存インストール
pnpm install

# クライアントビルド
pnpm --filter @web-speed-hackathon-2026/client build

# サーバー起動
pnpm --filter @web-speed-hackathon-2026/server start

# ルートからビルド+起動
cd application && pnpm build && pnpm start

# 型チェック
cd application && pnpm run --recursive typecheck

# フォーマット
cd application && pnpm run format

# シード再生成
pnpm --filter @web-speed-hackathon-2026/server seed:generate
pnpm --filter @web-speed-hackathon-2026/server seed:insert

# 計測ツール
cd scoring-tool && pnpm start
```

## レギュレーション (違反で順位対象外)

### 禁止事項
- VRT (Visual Regression Test) を失敗させてはならない
- `docs/test_cases.md` の手動テスト項目を失敗させてはならない
- シードの各種 ID を変更してはならない
- `GET /api/v1/crok{?prompt}` の SSE プロトコルを変更してはならない
- crok-response.md の情報を SSE 以外で伝達してはならない
- `fly.toml` を変更してはならない
- 悪意あるコードで VRT/手動テストを通過させてはならない

### 要求事項
- `POST /api/v1/initialize` で DB を初期状態にリセットできること
- アプリケーションが常にアクセス可能であること

### 許可事項
- コード・ファイルはすべて変更可能
- API 返却内容の変更可能
- 外部 SaaS 利用可能

## 既知のパフォーマンス問題 (優先度順)

### S級 (最重要)
- Webpack `mode: none` → `production` に変更
- `NODE_ENV=development` → `production` に変更
- Babel: `targets: "ie 11"` + `modules: "commonjs"` → モダンブラウザ + ESM
- `inline-source-map` → `hidden-source-map` or 削除
- GIF動画 179MB → MP4/WebM に変換
- Tailwind CDN → **build-time に移行済み** (fix/tailwind-npm ブランチ)
- core-js 全量ポリフィル → 不要（モダンブラウザのみ対応）

### A級
- `Cache-Control: max-age=0` → 適切なキャッシュ設定
- 圧縮なし → gzip/brotli 導入
- ETag 無効 → 有効化
- OTF フォント 12.6MB → WOFF2 サブセット化
- `font-display: block` → `swap`
- WASM 巨大ライブラリ (FFmpeg, ImageMagick) → サーバーサイド処理
- Post defaultScope で 5テーブル JOIN → 必要なときだけ eager load
- 画像 89MB → WebP/AVIF + リサイズ

### B級
- React.lazy 未使用 → コード分割
- moment / lodash / jQuery → 軽量代替
- 検索の二重クエリ → 最適化
- DB インデックス不足 → 追加
- crok 3秒 sleep → 削除

## 採点基準

### ページ表示 (900点) - 9ページ検査
FCP×10 + SI×10 + LCP×25 + TBT×30 + CLS×25 = 各ページ100点

検査ページ: ホーム, 投稿詳細, 写真投稿, 動画投稿, 音声投稿, DM一覧, DM詳細, 検索, 利用規約

### ページ操作 (250点) - 表示300点以上で採点
TBT×25 + INP×25 = 各シナリオ50点

検査シナリオ: 認証, DM, 検索, Crok, 投稿

## 手動テスト重要ポイント

変更前に `docs/test_cases.md` を必ず確認すること。特に注意:

- 動画: 自動再生、クリックで一時停止/再生、著しい劣化なし
- 音声: 波形表示、再生位置表示
- 画像: object-fit: cover、著しい劣化なし、ALT表示
- 投稿: TIFF画像、WAV音声、MKV動画のアップロード対応必須
- Crok: SSEストリーミング、Markdownレンダリング、コードハイライト、数式表示
- DM: WebSocket リアルタイム更新、未読バッジ、入力中インジケータ
- 検索: ネガティブ判定（感情極性辞書）、無限スクロール
- 利用規約: 源ノ明朝フォント表示

## コーディング規約

- TypeScript strict モード (@tsconfig/strictest 拡張)
- パスエイリアス: `@web-speed-hackathon-2026/client/*`, `@web-speed-hackathon-2026/server/*`
- リンター: oxlint (ESLint互換), フォーマッター: oxfmt
- pnpm ワークスペース: `application/client`, `application/server`
