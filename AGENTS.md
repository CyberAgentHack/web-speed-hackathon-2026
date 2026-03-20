# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Web Speed Hackathon 2026 — 架空のSNS「CaX」のパフォーマンス改善競技。Lighthouse計測で最大1150点（表示900点 + 操作250点）。表示で300点以上取らないと操作の採点が行われない。

## コマンド

すべて `application/` ディレクトリで実行する。ツール管理は mise（`mise trust && mise install`）。

```bash
# セットアップ
cd application && pnpm install

# ビルド（クライアント）
pnpm build

# サーバー起動（ポート3000、クライアントの dist を配信）
pnpm start

# 開発サーバー（ポート8080、/api をポート3000にプロキシ）
cd client && npx webpack serve

# 型チェック（全ワークスペース）
pnpm typecheck

# フォーマット
pnpm format

# DB シード再生成・挿入
cd server && pnpm seed:generate && pnpm seed:insert
```

ローカル計測（scoring-tool/）：
```bash
cd scoring-tool && pnpm install
pnpm start --applicationUrl http://localhost:8080
pnpm start --applicationUrl http://localhost:8080 --targetName  # 計測名一覧
pnpm start --applicationUrl http://localhost:8080 --targetName "計測名"  # 特定のみ
```

## アーキテクチャ

pnpm ワークスペースによるモノレポ（`application/` 配下）。

### Client (`application/client/`)
- React 19 + React Router 7 SPA、Webpack 5 + Babel でバンドル
- 状態管理: Redux（redux-form のみ）
- スタイル: PostCSS（Tailwind は CDN 読み込み）
- API呼び出し: jQuery AJAX ラッパー（`src/utils/fetchers.ts`）、gzip圧縮POST
- カスタムHooks: `use_fetch`, `use_infinite_fetch`（無限スクロール）, `use_sse`（SSE）, `use_ws`（WebSocket）
- メディア処理: FFmpeg WASM（動画変換）、ImageMagick WASM（画像変換）
- 検索: BM25 + kuromoji（日本語形態解析）、negaposi-analyzer-ja（感情分析）
- AI チャット: @mlc-ai/web-llm（ブラウザ内LLM）
- エントリ: `src/index.tsx` → `AppContainer.tsx`
- コンテナ/プレゼンテーション分離: `src/containers/` にロジック、`src/components/` にUI

### Server (`application/server/`)
- Express 5 + SQLite（Sequelize ORM）
- 認証: bcrypt + express-session
- WebSocket: ws（DM リアルタイム通信）
- APIベース: `/api/v1`
- エントリ: `src/index.ts`（ポート3000、環境変数 PORT で変更可）
- DB: `database.sqlite`（約98MB）
- モデル: User, Post, Image, Movie, Sound, Comment, ProfileImage, DirectMessage, DirectMessageConversation, QaSuggestion

### 静的ファイル
- `application/public/` — フォント、画像、動画、音声、kuromoji辞書、スプライト
- `application/upload/` — ユーザーアップロードファイル
- `application/dist/` — ビルド出力（サーバーが配信）

## レギュレーション（重要）

- **機能落ち・デザイン差異は禁止** — VRT と手動テスト項目（`docs/test_cases.md`）を通過すること
- **`POST /api/v1/initialize`** でDBが初期値にリセットされる機能を維持すること
- **シードの各種IDは変更禁止**
- **`GET /api/v1/crok{?prompt}` のSSEプロトコルは変更禁止**
- **crok-response.md の内容をSSE以外で伝達してはならない**
- **`fly.toml` は変更禁止**（Fly.io デプロイ時）

## Webpack の注意点

- `mode: "none"` で全最適化が無効（minimize, splitChunks, tree-shaking すべてoff）
- `devtool: "inline-source-map"` でソースマップがバンドルに含まれる
- ProvidePlugin で `$`, `Buffer`, `AudioContext` をグローバル注入
- core-js + regenerator-runtime がエントリに含まれる（IE11向けポリフィル）
- KaTeX フォントを dist にコピーしている

## 主要な改善ポイント（意図的に遅くしている箇所）

- Webpack最適化が全て無効（minify, code splitting, tree-shaking）
- inline-source-map でバンドルサイズ増大
- jQuery依存のAPI層
- core-js/regenerator-runtime の不要なポリフィル
- moment.js（大きいバンドル）
- lodash（全体インポート）
- ブラウザ内でFFmpeg/ImageMagick WASM を動かしている
- Tailwind CDN版
- Cache-Control: max-age=0（キャッシュ無効）
- Connection: close ヘッダー
- 画像・動画・音声の未最適化

## デプロイ

Dockerfile: マルチステージビルド → Fly.io（NRTリージョン、1CPU/2GB）
本番: PORT=8080, NODE_ENV=production

## リグレッションチェック

- `cd application/e2e && pnpm test` で Playwright E2E + VRT（Visual Regression Testing）を実行できる
- UI の変更は行わないため、VRT は常に通ることを期待する。VRT が落ちた場合はバグとして修正すること
- テスト実行前にサーバーがポート3000で起動している必要がある（`cd application && pnpm start`）

## Ralph Workflow

- Ralph runtime files live under `.agent/ralph/`
- Main state files are `.agent/ralph/prd.json` and `.agent/ralph/progress.txt`
- Each Ralph iteration should work on exactly one story
- A story is not done until required quality checks pass
- The final story in `.agent/ralph/prd.json` must be a Codex review and remediation story
- The review story is not done until Codex review is complete, every finding is fixed, and required quality checks pass again
- After finishing a story, update `.agent/ralph/prd.json` and append a verification log to `.agent/ralph/progress.txt`
- Each progress entry must include the story ID/title, the concrete implementation added or changed, the test case used for each acceptance criterion, and the result for each test case
- Each progress entry must also include the quality check commands that were run and their outcomes, plus the commit hash/message for that story
- Do not mark a story done if `progress.txt` does not show how every acceptance criterion was verified
- Each completed story MUST be committed as a separate commit. Do not batch multiple stories into one commit
- Commit message format: `feat: [Story ID] - [Story Title]`
- Reusable learnings should be written back to the nearest relevant `AGENTS.md`
- UI changes should be browser-verified using `agent-browser skill`
- Reply with `<promise>COMPLETE</promise>` only when every story has `passes: true`
