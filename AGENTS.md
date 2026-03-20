必ず守る、作業前にチェックする @./docs/regulation.md

bench を効率的に行うために bench/ を使うこと

deploy前の計測テストとして ./scoring-tool/README.md を実施する

@./README.md

## 改善方針

以下の「初期構成」は最も遅い状態のベースライン。レギュレーション違反しない限り、構成はどんどん変えてよい。
改善時は変更前の構成をここで確認し、何を変えたかを把握できるようにする。

---

## 開発環境

`nix develop` で開発に必要なツールが揃う（Node.js 24, pnpm, sqlite, chromium 等）。

### 起動手順

```bash
cd application
pnpm install
pnpm build                                          # client webpack build → dist/
pnpm --filter @web-speed-hackathon-2026/server seed:generate
pnpm --filter @web-speed-hackathon-2026/server seed:insert
pnpm start                                          # server → http://localhost:3000
```

dev server (HMR) を使う場合:

```bash
pnpm --filter @web-speed-hackathon-2026/client build  # webpack-dev-server on :8080, proxy /api → :3000
```

## アーキテクチャ概要（初期構成 / 最遅状態のベースライン）

> この構成は改善前のスナップショット。改善により自由に変更してよい。
> ただしレギュレーション（`docs/regulation.md`）は常に遵守すること。

### ディレクトリ構成

```
application/
├── client/          # React SPA (webpack, Tailwind v4 CDN)
├── server/          # Express API + static serving (SQLite, Sequelize)
├── e2e/             # E2E テスト
└── package.json     # ワークスペースルート (pnpm workspace)
scoring-tool/        # Lighthouse ベースの計測ツール
bench/               # ベンチマーク用スクリプト
```

### Server (`application/server/`)

**エントリ:** `src/index.ts` → `src/app.ts`
- Express 5 + SQLite (Sequelize ORM)
- HTTP on `0.0.0.0:3000`
- DB は `database.sqlite` を起動時に tmp へコピー

**ミドルウェア (順序):**
1. WebSocket サポート (カスタム ws アダプタ)
2. express-session (メモリストア, secret="secret")
3. bodyParser.json
4. Raw body parser (10MB limit, ファイルアップロード用)
5. Cache-Control: no-store ヘッダ

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
- history API fallback (SPA)
- ETags/Last-Modified 無効

### Client (`application/client/`)

**ビルド:** Webpack 5 (`webpack.config.js`)
- mode: none, minimize: false, splitChunks: false (意図的に最適化無効)
- Babel (TypeScript strip + IE11 target) → 108MB の main.js
- dev-server: `:8080`, proxy `/api` → `:3000`

**フレームワーク:** React 19 + React Router v7 + Redux (redux-form のみ)

**ルーティング:**

| パス | コンテナ | 内容 |
|------|---------|------|
| `/` | TimelineContainer | タイムライン (無限スクロール) |
| `/dm` | DirectMessageListContainer | DM 一覧 |
| `/dm/:conversationId` | DirectMessageContainer | DM チャット |
| `/search` | SearchContainer | 検索 |
| `/users/:username` | UserProfileContainer | ユーザープロフィール |
| `/posts/:postId` | PostContainer | 投稿詳細 |
| `/terms` | TermContainer | 利用規約 |
| `/crok` | CrokContainer | AI チャット |

**重量級依存:**
- `@ffmpeg/ffmpeg` + `@ffmpeg/core` — 動画→GIF 変換 (WASM)
- `@imagemagick/magick-wasm` — 画像→JPEG 変換 (WASM)
- `@mlc-ai/web-llm` — クライアントサイド LLM 推論
- `kuromoji` — 日本語形態素解析
- `negaposi-analyzer-ja` — 日本語感情分析 (3.29MB JSON dict)
- `bayesian-bm25` — BM25 検索ランキング
- `katex` + `react-syntax-highlighter` + `react-markdown` — リッチコンテンツ表示
- `jquery` + `jquery-binarytransport` — HTTP 通信 (gzip 圧縮)
- `moment`, `lodash`, `bluebird`, `core-js` — ユーティリティ

**スタイリング:** Tailwind CSS v4 (CDN), PostCSS, カスタムカラートークン (cax-*)

**データ取得:** カスタムフック (`useFetch`, `useInfiniteFetch`, `useSSE`, `useWebSocket`)
- jQuery AJAX ラッパー (`fetchJSON`, `sendJSON` with gzip)
- 30件ずつ offset ベースページネーション

### レギュレーション上の変更不可項目（サマリ）

- `GET /api/v1/crok{?prompt}` の SSE プロトコル変更禁止
- `crok-response.md` の情報は SSE 以外で伝達禁止
- `POST /api/v1/initialize` でDBが初期値にリセットされること必須
- シードデータの各種ID変更禁止
- VRT・手動テストが通ること（機能落ち・デザイン差異NG）
- `fly.toml` 変更禁止（Fly.io デプロイ時）

### 初期構成の主なボトルネック（改善候補）

| # | カテゴリ | ボトルネック | 根拠 |
|---|---------|-------------|------|
| 1 | ビルド | Webpack `mode: none`, `minimize: false`, `splitChunks: false` → 108MB main.js | 全コードが未圧縮1ファイル |
| 2 | Polyfill | `core-js` + `regenerator-runtime` + Babel IE11 target | 最新Chrome不要のpolyfill大量 |
| 3 | WASM | FFmpeg / ImageMagick / WebLLM がクライアントにバンドル | 初期ロードで巨大WASMダウンロード |
| 4 | レガシーライブラリ | jQuery, Bluebird, Moment, Lodash (全量) | ネイティブAPIで代替可能 |
| 5 | キャッシュ | `Cache-Control: max-age=0`, ETags無効 | 再訪問でも全リソース再取得 |
| 6 | 接続 | `Connection: close` | Keep-Alive無効で接続コスト増 |
| 7 | レンダリング | CSR only, `window.load` でマウント | FCP/LCP遅延 |
| 8 | 重量コンポーネント | KaTeX, react-syntax-highlighter, kuromoji辞書 | 遅延ロードなし |
