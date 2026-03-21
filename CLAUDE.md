# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

会話やドキュメントを書く際は必ず日本語で記載すること。

## プロジェクト概要

Web Speed Hackathon 2026 — 架空のSNS「CaX」のパフォーマンスを改善する競技。Lighthouse スコア（表示900点 + 操作250点 = 1150点満点）で採点される。

## コマンド

```bash
# セットアップ（mise-en-place が必要）
mise trust && mise install
cd application && pnpm install --frozen-lockfile

# ビルド・起動
pnpm run build          # Webpack でクライアントビルド
pnpm run start          # Express サーバー起動（localhost:3000）

# 型チェック・フォーマット
pnpm run typecheck      # 全パッケージの TypeScript 型チェック
pnpm run format         # oxlint + oxfmt

# シードデータ
pnpm --filter server run seed:generate
pnpm --filter server run seed:insert

# E2E テスト（VRT）
pnpm --filter e2e exec playwright install chromium    # 初回のみ
pnpm --filter e2e run test                            # ローカル実行（要サーバー起動）
pnpm --filter e2e run test:update                     # スクリーンショット更新
E2E_BASE_URL=https://example.com pnpm --filter e2e run test  # リモート実行
```

## アーキテクチャ

### モノレポ構成（pnpm workspaces）

- `application/client/` — React 19 SPA（Webpack 5、Babel、PostCSS）
- `application/server/` — Express 5 API サーバー（Sequelize + SQLite）
- `application/e2e/` — Playwright E2E テスト（VRT）
- `scoring-tool/` — Lighthouse ベースのスコアリングツール（独立ワークスペース）

### クライアント

- エントリ: `client/src/index.tsx` → Redux Provider + React Router の BrowserRouter でラップ
- ルーティング: `AppContainer.tsx` で React Router v7 を使用（`/`, `/posts/:postId`, `/users/:username`, `/dm`, `/search`, `/terms`, `/crok`）
- 状態管理: Redux は redux-form のみ。データフェッチはカスタムフック（`useInfiniteFetch`, `useWs`, `useFetch`）でコンポーネントローカルに管理
- Webpack: `client/webpack.config.js` — 最適化は意図的に無効化（minimization なし、code splitting なし）。ここがパフォーマンス改善のポイント
- 重いライブラリ: FFmpeg.wasm, ImageMagick Wasm, Web LLM, jQuery, KaTeX, kuromoji, react-syntax-highlighter

### サーバー

- エントリ: `server/src/index.ts` → Sequelize 初期化 → Express + WebSocket 起動
- API: `/api/v1/*` 以下にモジュール分割（auth, user, post, comment, direct_message, search, crok, image, movie, sound, initialize）
- WebSocket: Express Router を拡張した `.ws()` メソッドで DM のリアルタイム通信（eventhub による pub/sub）
- DB: SQLite ファイル（`server/database.sqlite`）。Sequelize モデルは defaultScope で関連を自動 include
- `POST /api/v1/initialize` — DB を初期状態にリセット（E2E テスト・採点時に使用）

### Crok（AIチャット）

- `GET /api/v1/crok?prompt=...` は Server-Sent Events でストリーミング
- SSE プロトコルの変更は禁止。レスポンス内容を SSE 以外で伝達することも禁止

## レギュレーション（重要 — 違反は順位対象外）

### 禁止事項
- **著しい機能落ちやデザイン差異を発生させてはならない** — VRT（Visual Regression Tests）と [手動テスト項目](docs/test_cases.md) の両方をパスすること
- **シードデータの各種 ID を変更してはならない**
- **`fly.toml` を変更してはならない**（Fly.io デプロイ時）
- **`GET /api/v1/crok{?prompt}` の SSE プロトコルを変更してはならない**
- **`crok-response.md` の画面構成に必要な情報を SSE 以外の方法で伝達してはならない**
- **VRT・手動テストを通過させるためだけの悪意あるコードを書いてはならない**

### 必須要件
- **`POST /api/v1/initialize` で DB が初期値にリセットされること** — 採点サーバーは初期データ前提で計測する
- **競技終了後〜順位確定まで、アプリケーションにアクセスできる状態を維持すること**

### 許可されていること
- コード・ファイルはすべて自由に変更可
- API レスポンスの項目追加・削除も可
- 外部サービス（SaaS 等）の利用可（費用は自己負担）

## 採点対象ページ（表示）

ホーム、投稿詳細（テキスト/写真/動画/音声）、DM一覧、DM詳細、検索、利用規約 — 計9ページ

## 採点対象シナリオ（操作）

ユーザー認証、DM送信、検索→結果表示、Crokチャット、投稿（テキスト+メディア）— 計5シナリオ

## API ドキュメント

`application/server/openapi.yaml` に OpenAPI 仕様あり
