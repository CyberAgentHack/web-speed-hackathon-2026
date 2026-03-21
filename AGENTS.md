# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Web Speed Hackathon 2026 — 架空のSNS「CaX」のパフォーマンス改善競技。Lighthouse計測で最大1150点（表示900点 + 操作250点）。表示で300点以上取らないと操作の採点が行われない。

## コマンド

すべて `application/` ディレクトリで実行する。ツール管理は mise（`mise trust && mise install`）。

```bash
# セットアップ
cd application && pnpm install

# 開発サーバー（ポート8080、/api をポート3000にプロキシ）
pnpm dev

# ビルド（クライアント、本番用）
pnpm build

# サーバー起動（クライアントの dist を配信）
# ローカルではポート3001で起動する（本番は fly.toml の PORT=8080 を使用）
PORT=3001 pnpm start

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
- React 19 + React Router 7 SPA、Rspack + SWC でバンドル
- 状態管理: Redux（redux-form のみ）
- スタイル: PostCSS（Tailwind v4 ビルド時生成）
- API呼び出し: fetch API ラッパー（`src/utils/fetchers.ts`）、gzip圧縮POST（pako）
- カスタムHooks: `use_fetch`, `use_infinite_fetch`（無限スクロール、サーバーサイドページネーション対応）, `use_sse`（SSE）, `use_ws`（WebSocket）
- メディア処理: FFmpeg WASM（動画変換、投稿時のみ）
- 検索: BM25 + kuromoji（日本語形態解析、dynamic import）、感情分析はサーバーサイド（`/api/v1/sentiment`）
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

## Rspack の設定

- `mode: "production"` で最適化有効（minimize, splitChunks: "all"）
- `devtool: false`（ソースマップなし）
- `builtin:swc-loader` で TypeScript/JSX をトランスパイル
- ProvidePlugin で `Buffer`, `AudioContext` をグローバル注入
- `HtmlRspackPlugin` で `inject: true`（script/link タグ自動挿入）
- KaTeX フォントを `CopyRspackPlugin` で dist にコピー

## チューニング知見

パフォーマンス改善の詳細な攻略知見は [.claude/skills/wsh-tuning/](.claude/skills/wsh-tuning/) を参照。
- `React.memo` を API フェッチ由来のリスト行に使うときは、再 fetch のたびに新規オブジェクトになるモデル全体を props で渡さず、文字列・真偽値などの安定した表示用 props に落としてからメモ化すると効果が出やすい

## テストアカウント

- ユーザー名: `o6yq16leo`
- パスワード: `wsh-2026`

## デプロイ

Dockerfile: マルチステージビルド → Fly.io（NRTリージョン、1CPU/2GB）
本番: PORT=8080, NODE_ENV=production

## リグレッションチェック

- `cd application/e2e && pnpm test` で Playwright E2E + VRT（Visual Regression Testing）を実行できる
- UI の変更は行わないため、VRT は常に通ることを期待する。VRT が落ちた場合はバグとして修正すること
- **E2Eテストは基本的に開発サーバー（`pnpm dev`、ポート8080）に対して実行する**。devサーバーはHMR対応のため、コード変更後に再起動する必要はない。ただし、devサーバーが起動していない場合は自分で起動せずユーザーに通知すること
- `pnpm start`（3001）に対して E2E を実行する場合は `E2E_BASE_URL=http://localhost:3001 pnpm test`
- Playwright が Chrome を起動する際にサンドボックスの権限エラーが発生するため、E2E テスト実行時は `dangerouslyDisableSandbox: true` で実行すること
- **E2Eが失敗した場合は `agent-browser` skill を使ってブラウザで実際の画面を確認しデバッグすること**

## Fly.io のdebug

```bash
# ログ確認（環境変数でトークンを渡す）
FLY_API_TOKEN='<アクセストークン>' flyctl logs --app pr-54-web-speed-hackathon-2026 --no-tail

# 直近のログのみ表示
FLY_API_TOKEN='<アクセストークン>' flyctl logs --app pr-54-web-speed-hackathon-2026 --no-tail | tail -80
```

- Read-only token は [./docs/token.txt](./docs/token.txt) を参照
- `--access-token` フラグは flyctl で無視されるため、`FLY_API_TOKEN` 環境変数で渡すこと
- アプリ名は `pr-54-web-speed-hackathon-2026` 固定


## Ralph Workflow

- Ralph runtime files live under `.agent/ralph/`
- Main state files are `.agent/ralph/prd.json` and `.agent/ralph/progress.txt`
- **1 iteration = 1 story のみ。** 1回の起動で複数ストーリーを処理してはならない。最優先の `passes=false` ストーリーを1つだけ完了し、commit して即座に終了すること。これは毎回 context をリセットして fresh な状態で次のストーリーに取り組むための設計意図である
- A story is not done until required quality checks pass
- After finishing the single story, update `.agent/ralph/prd.json` (set `passes: true`), append a verification log to `.agent/ralph/progress.txt`, commit, then **exit immediately**
- Each progress entry must include the story ID/title, the concrete implementation added or changed, the test case used for each acceptance criterion, and the result for each test case
- Each progress entry must also include the quality check commands that were run and their outcomes, plus the commit hash/message for that story
- Do not mark a story done if `progress.txt` does not show how every acceptance criterion was verified
- Each completed story MUST be committed as a separate commit. Do not batch multiple stories into one commit
- Commit message format: `feat: [Story ID] - [Story Title]`
- Reusable learnings should be written back to the nearest relevant `AGENTS.md`
- UI changes should be browser-verified using `agent-browser skill`
- Do NOT reply with `<promise>COMPLETE</promise>` unless every story in `prd.json` has `passes: true`. If you just completed one story and others remain, simply exit without this tag
