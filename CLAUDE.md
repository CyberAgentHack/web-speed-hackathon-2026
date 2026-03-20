# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web Speed Hackathon 2026 — 架空の SNS「CaX」のパフォーマンスを改善する競技。意図的に重く作られたアプリを高速化する。採点は Lighthouse ベース（1150点満点）。

**重要な制約（レギュレーション）:**
- VRT と手動テストが失敗しない範囲でのみ変更可能
- `fly.toml` は変更禁止
- `GET /api/v1/crok{?prompt}` の SSE プロトコルは変更禁止
- `POST /api/v1/initialize` でデータベースが初期値にリセットされること必須
- シードデータの各種 ID は変更禁止

## Commands

### Setup
```bash
mise trust && mise install          # Node 24.14.0 + pnpm 10.32.1
cd application && pnpm install --frozen-lockfile
```

### Build & Run (application/ ディレクトリ内)
```bash
pnpm run build          # Webpack でクライアントビルド
pnpm run start          # サーバー起動 (http://localhost:3000)
```

### Lint & Format (application/ ディレクトリ内)
```bash
pnpm run format          # oxlint --fix && oxfmt
pnpm run typecheck       # 全ワークスペースの tsc
```

### E2E テスト (application/ ディレクトリ内)
```bash
pnpm --filter @web-speed-hackathon-2026/e2e exec playwright install chromium
pnpm run build && pnpm run start   # サーバー起動が前提
cd e2e && pnpm run test            # VRT 実行 (localhost:3000)
cd e2e && pnpm run test:update     # スナップショット更新
E2E_BASE_URL=https://example.com pnpm run test   # リモート対象
```

### ローカル採点 (scoring-tool/ ディレクトリ内)
```bash
cd scoring-tool && pnpm install --frozen-lockfile
pnpm start --applicationUrl http://localhost:3000
pnpm start --applicationUrl http://localhost:3000 --targetName         # 計測名一覧
pnpm start --applicationUrl http://localhost:3000 --targetName "投稿"  # 特定の計測のみ
```

### シードデータ (application/server/ ディレクトリ内)
```bash
pnpm run seed:generate   # シード生成
pnpm run seed:insert     # シード挿入
```

## Architecture

### Monorepo 構成 (pnpm workspaces)
- `application/client/` — React 19 SPA (Webpack 5, Babel, Redux, React Router v7)
- `application/server/` — Express 5 API サーバー (Sequelize + SQLite, tsx で実行)
- `application/e2e/` — Playwright VRT
- `scoring-tool/` — Lighthouse ベースの採点ツール（独立した pnpm workspace）

### Client
- **エントリポイント**: `client/src/index.tsx` → Redux Provider + BrowserRouter
- **ルーティング** (`containers/AppContainer.tsx`): `/`, `/posts/:postId`, `/dm`, `/dm/:conversationId`, `/search`, `/users/:username`, `/terms`, `/crok`
- **状態管理**: Redux (redux-form のみ)。ほとんどのデータは React hooks でローカル管理
- **ビルド**: Webpack 5。最適化は全て無効化済み（minimize, splitChunks, concatenateModules 等）→ ここが改善ポイント
- **重い依存**: FFmpeg WASM, ImageMagick WASM, web-llm, kuromoji, jQuery, lodash, moment, bluebird, katex → バンドルサイズ最適化の主要ターゲット
- **メディア変換**: クライアント側で FFmpeg/ImageMagick を使い画像・動画変換を実行

### Server
- **エントリポイント**: `server/src/index.ts` → Sequelize 初期化 → Express app 起動 (port 3000)
- **DB**: SQLite (`server/src/database.sqlite` をシードとして temp にコピー)。起動時に毎回初期化
- **セッション**: express-session (MemoryStore)
- **リアルタイム**: WebSocket (ws) で DM・タイピング通知、SSE で CROK AI チャット
- **API**: `/api/v1/` 以下に REST エンドポイント群。主要ルートファイルは `server/src/routes/api/` 配下
- **モデル**: User, Post, Image, Movie, Sound, Comment, ProfileImage, DirectMessage, DirectMessageConversation, QaSuggestion
- **イベントバス**: `server/src/eventhub.ts` (Node EventEmitter) でリアルタイム機能を実装

### 採点ページ（9ページ表示 + 5シナリオ操作）
表示: ホーム, 投稿詳細(テキスト/写真/動画/音声), DM一覧, DM詳細, 検索, 利用規約
操作: 認証, DM送信, 検索, Crok AI, 投稿
