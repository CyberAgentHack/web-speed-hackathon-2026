必ず守る、作業前にチェックする @./docs/regulation.md

bench を効率的に行うために bench/ を使うこと

deploy前の計測テストとして ./scoring-tool/README.md を実施する

@./README.md

---

## ブランチ運用（トランクベース）

| ブランチ | 役割 |
|---------|------|
| `main` | 開発トランク。改善を直接積み上げる |
| `bench` | 計測専用。main から同期して scoring-tool / bench を実行 |

### 計測の流れ

```bash
# 1. main で改善をコミット
git add -A && git commit -m "perf: ..."

# 2. bench ブランチに同期
git checkout bench && git merge main

# 3. actrun でローカル計測（ビルド → サーバー起動 → scoring-tool → bench suite）
actrun workflow run .github/workflows/bench.yml

# 4. main に戻って開発続行
git checkout main
```

### actrun 設定

- `actrun.toml` でローカル実行時の挙動を制御
- `nix develop` 環境を自動検出（Node.js, pnpm, chromium）
- `actions/checkout` と `actions/setup-node` はローカルでスキップ
- `.github/workflows/bench.yml` が scoring-tool と bench/run-all.sh を順に実行

## 開発環境

`nix develop` で開発に必要なツールが揃う（Node.js 24, pnpm, sqlite, chromium 等）。

### 環境変数（`nix develop` の shellHook で自動設定）

| 変数 | 用途 |
|------|------|
| `CHROME_PATH` | Lighthouse / scoring-tool 用 |
| `CHROMIUM_PATH` | Lighthouse / scoring-tool 用 |
| `PUPPETEER_EXECUTABLE_PATH` | Puppeteer 用 |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` | Playwright (E2E/VRT) 用。未設定だと `channel: "chrome"` で `/opt/google/chrome/chrome` を探しに行き失敗する |

**注意:** `nix develop` 外でコミットすると VRT の pre-commit hook が Chrome を見つけられず失敗する。必ず `nix develop` シェル内で作業すること。

### 起動手順

```bash
cd application
pnpm install
pnpm build                                          # Vite build → dist/ + dist-ssr/
pnpm --filter @web-speed-hackathon-2026/server seed:generate
pnpm --filter @web-speed-hackathon-2026/server seed:insert
PORT=3333 pnpm start                                # server → http://localhost:3333
```

> **注意:** Port 3000 は vibe-kanban が常時使用しているため、このプロジェクトでは **PORT=3333** を使う。
> VRT/E2E 実行時は `E2E_BASE_URL=http://localhost:3333` を設定すること。

dev server (HMR) を使う場合:

```bash
pnpm --filter @web-speed-hackathon-2026/client dev   # Vite dev server on :8080, proxy /api → :3333
```

## アーキテクチャ概要（現在の構成）

### ディレクトリ構成

```
application/
├── client/          # React SPA + SSR (Vite, Tailwind v4 local)
├── server/          # Hono API + SSR + static serving (SQLite, Sequelize)
├── e2e/             # Playwright E2E/VRT テスト
└── package.json     # ワークスペースルート (pnpm workspace)
scoring-tool/        # Lighthouse ベースの計測ツール
bench/               # ベンチマーク用スクリプト
```

### Server (`application/server/`)

**エントリ:** `src/index.ts` → `src/app.ts`
- **Hono 4** + `@hono/node-server` + `@hono/node-ws`
- SQLite (Sequelize ORM)
- HTTP on `0.0.0.0:PORT` (デフォルト 3000, 開発時は 3333)
- DB は `database.sqlite` を起動時に tmp へコピー

**キャッシュ戦略:**
- HTML: `no-cache`（常に再検証）
- ハッシュ付きアセット (JS/CSS): `public, max-age=31536000, immutable`
- アップロードコンテンツ: `public, max-age=86400`

**API エンドポイント (`/api/v1`):**

| カテゴリ | エンドポイント | 概要 |
|---------|-------------|------|
| Auth | `POST /signup, /signin, /signout` | セッションベース認証 |
| User | `GET /me`, `PUT /me`, `GET /users/:username`, `GET /users/:username/posts` | プロフィール CRUD |
| Post | `GET /posts`, `GET /posts/:postId`, `GET /posts/:postId/comments`, `POST /posts` | 投稿 CRUD (画像/動画/音声添付可) |
| DM | `GET,POST /dm`, `GET /dm/:id`, `POST /dm/:id/messages`, `POST /dm/:id/read`, `POST /dm/:id/typing` | DM + WebSocket リアルタイム |
| Search | `GET /search?q=&limit=&offset=` | テキスト・ユーザー・日付範囲検索 |
| Upload | `POST /images` (JPG), `POST /movies` (GIF), `POST /sounds` (MP3) | メディアアップロード |
| AI Chat | `GET /crok?prompt=` (SSE), `GET /crok/suggestions` | Crok AI チャット (SSE ストリーム) |
| System | `POST /initialize` | DB・セッション・アップロード全リセット |

**WebSocket:**
- `WS /api/v1/dm/unread/ws` — 未読数リアルタイム通知
- `WS /api/v1/dm/:conversationId/ws` — メッセージ & タイピング通知
- EventEmitter ベースの pub/sub (`src/eventhub.ts`)

**DB モデル:**
User, Post, Comment, Image, Movie, Sound, ProfileImage, DirectMessage, DirectMessageConversation, PostsImagesRelation, QaSuggestion

**静的ファイル配信:**
- `/public` — 公開アセット
- `/upload` — アップロードファイル (images/, movies/, sounds/)
- `/dist` — クライアントビルド成果物
- SSR fallback（history API 代替）

### Client (`application/client/`)

**ビルド:** Vite 8 (`vite.config.ts`)
- ハッシュ付きチャンク分割: `scripts/chunk-[hash].js`
- SSR ビルド: `vite.config.ssr.ts` → `dist-ssr/entry-server.js`

**レンダリング:** SSR + Client Hydration
- サーバー: `renderToPipeableStream` でストリーミング SSR
- クライアント: `hydrateRoot` で hydration（SSR データなしの場合は `createRoot` で CSR フォールバック）
- SSR データ: `window.__SSR_DATA__` 経由で posts, user 等を渡す

**フレームワーク:** React 19 + React Router v7 + Redux (redux-form のみ)

**ルーティング:**

| パス | コンテナ | SSR |
|------|---------|-----|
| `/` | TimelineContainer | posts |
| `/search` | SearchContainer | posts |
| `/users/:username` | UserProfileContainer | user, userPosts |
| `/posts/:postId` | PostContainer | - |
| `/dm` | DirectMessageListContainer | - |
| `/dm/:conversationId` | DirectMessageContainer | - |
| `/terms` | TermContainer | - |
| `/crok` | CrokContainer | - |

**データ取得:** Native fetch API (`useFetch`, `useInfiniteFetch`, `useSSE`, `useWebSocket`)
- 30件ずつ offset ベースページネーション

**重量級依存（未解消）:**
- `@ffmpeg/ffmpeg` + `@ffmpeg/core` — 動画→GIF 変換 (WASM)
- `@imagemagick/magick-wasm` — 画像→JPEG 変換 (WASM)
- `@mlc-ai/web-llm` — クライアントサイド LLM 推論
- `kuromoji` — 日本語形態素解析
- `negaposi-analyzer-ja` — 日本語感情分析 (3.29MB JSON dict)
- `katex` + `react-syntax-highlighter` + `react-markdown` — リッチコンテンツ表示

**スタイリング:** Tailwind CSS v4 (ローカル, `@tailwindcss/vite` プラグイン)

### レギュレーション上の変更不可項目（サマリ）

- `GET /api/v1/crok{?prompt}` の SSE プロトコル変更禁止
- `crok-response.md` の情報は SSE 以外で伝達禁止
- `POST /api/v1/initialize` でDBが初期値にリセットされること必須
- シードデータの各種ID変更禁止
- VRT・手動テストが通ること（機能落ち・デザイン差異NG）
- `fly.toml` 変更禁止（Fly.io デプロイ時）

### 残ボトルネック（改善候補）

| # | カテゴリ | ボトルネック | 備考 |
|---|---------|-------------|------|
| 1 | WASM | FFmpeg / ImageMagick / WebLLM がクライアントにバンドル | 初期ロードで巨大WASMダウンロード |
| 2 | 重量コンポーネント | KaTeX, react-syntax-highlighter, kuromoji辞書 | 遅延ロードの余地あり |
| 3 | DB | Sequelize ORM のオーバーヘッド | Drizzle 等への移行候補 |
