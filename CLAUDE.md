# Web Speed Hackathon 2026 - CaX

## プロジェクト概要

Web パフォーマンス最適化コンペティション用の架空 SNS サイト「CaX」。
意図的に重く作られた Web アプリを、機能・デザインを維持しつつ高速化することが目的。

採点: Lighthouse によるページ表示(900点) + ページ操作(250点)の合計1150点満点。
ページ表示で300点未満の場合、ページ操作の採点は行われない(0点扱い)。

## 技術スタック

- **モノレポ**: pnpm workspaces (pnpm 10.32.1)
- **フロントエンド**: React 19, Redux (legacy_createStore), redux-form, React Router 7, Tailwind CSS (CDN)
- **バックエンド**: Express 5 (Node.js), SPA (SSR なし)
- **DB**: SQLite (sqlite3) + Sequelize 6
- **バンドラ**: Webpack 5 (意図的に最適化無効)
- **トランスパイラ**: Babel (IE 11 ターゲット)
- **テスト**: Playwright (VRT)
- **ランタイム**: Node.js 24.14.0
- **言語**: TypeScript 5.9.3
- **Linter**: oxlint + oxfmt

## ワークスペース構成

```
application/
├── client/   (@web-speed-hackathon-2026/client)  - Webpack SPA
├── server/   (@web-speed-hackathon-2026/server)  - Express バックエンド
├── e2e/      (@web-speed-hackathon-2026/e2e)     - VRT (Playwright)
└── public/   (静的アセット: 画像89MB, 動画179MB, 音声66MB, フォント13MB, 辞書17MB)

scoring-tool/ (@web-speed-hackathon-2026/scoring-tool) - Lighthouse 12.8 ベースの採点ツール
```

### 依存関係フロー

- `client` → React 19, Redux, jQuery, Webpack
- `server` → Express 5, Sequelize 6, SQLite
- `e2e` → Playwright 1.50.1
- `scoring-tool` → Lighthouse 12.8, Playwright 1.56.0

## コマンド

```bash
# セットアップ (mise が必要)
mise trust && mise install
cd application && pnpm install --frozen-lockfile

# ビルド & 起動
cd application && pnpm run build    # Webpack でクライアントビルド
cd application && pnpm run start    # サーバー起動 (localhost:3000)

# Docker ワークフロー
docker build -t wsh2026 .
docker run -p 8080:8080 wsh2026

# VRT
cd application && pnpm --filter "@web-speed-hackathon-2026/e2e" exec playwright install chromium
cd application && pnpm --filter "@web-speed-hackathon-2026/e2e" run test
cd application && pnpm --filter "@web-speed-hackathon-2026/e2e" run test:update  # スナップショット更新

# ローカル採点
cd scoring-tool && pnpm install --frozen-lockfile
cd scoring-tool && pnpm start --applicationUrl http://localhost:3000

# リント & フォーマット
cd application && pnpm run format
```

## アプリケーション URL

- Web アプリ: `http://localhost:3000/`
- API: `http://localhost:3000/api/v1/`
- API ドキュメント (OpenAPI): `application/server/openapi.yaml`

## 主要ディレクトリ構造

### クライアント (`application/client/src/`)
- `index.tsx` - エントリポイント (React root, Redux Provider, BrowserRouter)
- `index.html` - HTML テンプレート (Tailwind CSS CDN 読み込み)
- `containers/` - ページコンテナ (13個: App, Timeline, Post, UserProfile, DM, Search, Crok, Auth, Term...)
- `components/` - UI コンポーネント (foundation/, timeline/, post/, crok/, auth_modal/, direct_message/...)
- `store/` - Redux store (legacy_createStore)
- `utils/fetchers.ts` - HTTP クライアント (jQuery + pako gzip 圧縮)
- `utils/load_ffmpeg.ts` - FFmpeg WASM ローダー
- `utils/convert_image.ts` - ImageMagick WASM 画像変換
- `utils/create_translator.ts` - Web-LLM 翻訳
- `utils/bm25_search.ts` - BM25 検索 (kuromoji + bayesian-bm25)
- `utils/negaposi_analyzer.ts` - 感情分析 (negaposi-analyzer-ja)

### サーバー (`application/server/src/`)
- `index.ts` - サーバーエントリ (ポート 3000)
- `app.ts` - Express アプリ (session, bodyParser, Cache-Control: max-age=0)
- `routes/api/` - REST API (auth, user, post, image, movie, sound, direct_message, search, crok, initialize)
- `routes/static.ts` - 静的ファイル配信 (connect-history-api-fallback, serve-static, etag: false)
- `models/` - Sequelize モデル (User, Post, Image, Movie, Sound, Comment, DirectMessage, DirectMessageConversation, ProfileImage, PostsImagesRelation, QaSuggestion)
- `routes/api/crok.ts` - AI チャット (Server-Sent Events)

### ルーティング

```
/              → TimelineContainer (ホーム、タイムライン)
/posts/:postId → PostContainer (投稿詳細: テキスト/写真/動画/音声)
/users/:username → UserProfileContainer
/dm            → DirectMessageListContainer
/dm/:conversationId → DirectMessageContainer
/search        → SearchContainer
/terms         → TermContainer
/crok          → CrokContainer (AI チャット)
```

## 採点方法

### ページの表示 (900点満点、9ページ × 100点)

| ページ | パス |
|--------|------|
| ホーム | `/` |
| 投稿詳細 | `/posts/:postId` |
| 写真つき投稿詳細 | `/posts/:postId` |
| 動画つき投稿詳細 | `/posts/:postId` |
| 音声つき投稿詳細 | `/posts/:postId` |
| DM一覧 | `/dm` |
| DM詳細 | `/dm/:conversationId` |
| 検索 | `/search` |
| 利用規約 | `/terms` |

配点ウェイト (各ページ100点): FCP:10, SI:10, LCP:25, TBT:30, CLS:25

### ページの操作 (250点満点、5フロー × 50点)

| フロー | 内容 |
|--------|------|
| ユーザー認証 | 登録 → サインアウト → サインイン |
| DM | メッセージ送信 |
| 検索 | 検索 → 結果表示 |
| Crok | AI チャット実行 |
| 投稿 | テキスト投稿 → メディアつき投稿 |

配点ウェイト (各フロー50点): TBT:25, INP:25

## レギュレーション (重要)

### 絶対に守ること
1. **VRT を通過させること** (Playwright スクリーンショット比較)
2. **手動テスト項目を通過させること** (`docs/test_cases.md` 参照)
3. **Chrome 最新版で著しい機能落ちやデザイン差異を出さない**
4. **`POST /api/v1/initialize` で DB を初期状態にリセットできること**
5. **シード ID を変更しないこと**
6. **`GET /api/v1/crok{?prompt}` の SSE プロトコルを変更しないこと**
7. **SSE 以外の方法で Crok レスポンス情報を伝達しないこと**
8. **fly.toml を変更しないこと** (Fly.io デプロイ時)

### 許可されていること
- すべてのコード・ファイルを変更可能
- API レスポンスの項目追加・削除可能
- 外部 SaaS の利用可能

## Webpack 設定 (意図的に壊されている)

```js
// application/client/webpack.config.js
mode: "none",                    // → "production" に変更可能
optimization: {
  minimize: false,               // ミニファイ無効
  splitChunks: false,            // コード分割無効
  concatenateModules: false,     // モジュール結合無効
  usedExports: false,            // ツリーシェイキング無効
  providedExports: false,
  sideEffects: false,
},
cache: false,                    // キャッシュ無効
devtool: "inline-source-map",   // インラインソースマップ (巨大)
```

Babel は IE 11 をターゲット (`babel.config.js`)。

## 意図的なパフォーマンス問題

### バンドル
- **core-js + regenerator-runtime** がエントリに丸ごと含まれる
- **jQuery** で全 HTTP リクエスト + クライアント側 gzip 圧縮 (pako)
- **Webpack 最適化が全無効** (minimize, splitChunks, tree-shaking)
- **inline-source-map** でバンドルサイズ倍増
- **Tailwind CSS を CDN で実行時コンパイル**

### 重量級依存
- `@ffmpeg/ffmpeg` + `@ffmpeg/core` — 動画エンコード WASM
- `@imagemagick/magick-wasm` — 画像処理 WASM
- `@mlc-ai/web-llm` — ブラウザ上 LLM 推論
- `kuromoji` + `negaposi-analyzer-ja` — 形態素解析 + 感情分析 (辞書17MB)
- `lodash`, `moment`, `bluebird` — 重い utility ライブラリ
- `standardized-audio-context` — Web Audio API polyfill
- `react-syntax-highlighter` — コードハイライト
- `katex` + `rehype-katex` + `remark-math` — 数式レンダリング

### アセット
- `/public/` 合計 366 MB (movies 179MB, images 89MB, sounds 66MB, dicts 17MB, fonts 13MB)
- データベース 94 MB (`application/server/database.sqlite`)

### サーバー
- `Cache-Control: max-age=0, no-transform` (キャッシュ無効)
- `etag: false, lastModified: false` (静的ファイルの条件付きリクエスト無効)
- `Connection: close` (keep-alive 無効)

## 環境変数

| 変数 | デフォルト | 用途 |
|------|-----------|------|
| `PORT` | 3000 (dev) / 8080 (prod) | サーバーポート |
| `NODE_ENV` | development | ビルドモード |
| `E2E_BASE_URL` | http://localhost:3000 | VRT テスト対象 URL |

## パフォーマンス最適化スキル

`.claude/skills/` に最適化ワークフロー用のカスタムスキルがある。

### メインループ

```
perf-measure → perf-diagnose → perf-propose → [実装] → perf-validate → perf-measure
     ↑                                                                      |
     └──────────────────────────────────────────────────────────────────────┘
```

### コアスキル（計測・提案・検証・分析）

| スキル | トリガー | 内容 |
|--------|---------|------|
| **perf-measure** | 「計測して」「スコアは？」 | scoring-tool + Lighthouse で9ページ+5フロー計測 → report.md 出力 |
| **perf-propose** | 「改善案を考えて」「次に何を直す？」 | 計測結果を元にコードベースを調査し、優先度付き施策を proposals.md に出力 |
| **perf-validate** | 「チェックして」「テスト通る？」 | ビルド → バンドルサイズ → レギュレーション → VRT を一括検証 |
| **bundle-analyze** | 「バンドル分析」「何が大きい？」 | チャンクサイズ・依存ライブラリ検出・コード分割状態・最適化機会を可視化 |

### 調査・監査スキル

| スキル | トリガー | 内容 |
|--------|---------|------|
| **perf-regression-diff** | 「前回と比較して」「改善した？」 | 2 回以上の計測結果を比較し、改善・悪化・ノイズを判定 |
| **cwv-trace-investigate** | 「原因を調べて」「トレースして」 | chrome-devtools トレースで LCP/CLS/TBT の根本原因を分解 |
| **critical-path-audit** | 「配信設定を見て」「圧縮効いてる？」 | compression, cache-control, render-blocking を点検 |
| **dependency-prune** | 「不要な依存を探して」 | 未使用依存、重いライブラリ、不要 polyfill を検出 |
| **route-budget-check** | 「ルート別に見て」「このページだけ遅い」 | ルート単位の JS サイズ、request 数、LCP を予算と照合 |

### 運用・防御スキル

| スキル | トリガー | 内容 |
|--------|---------|------|
| **regulation-guard** | 「レギュレーション大丈夫？」 | VRT、手動テスト、DB初期化、SSE、fly.toml の項目を詳細チェック |
| **perf-experiment-log** | 「実験ログを残して」 | 仮説・変更・結果・次アクションを構造化して記録 |

### エージェントスキル（自律実行）

| スキル | トリガー | 内容 |
|--------|---------|------|
| **perf-diagnose** | 「なぜ遅い？」「原因を調べて」 | 失点分析 → 調査スキル自動選択 → 根本原因特定 → 診断レポート出力 |
| **perf-optimize-loop** | 「スコアを XX 点まで上げて」「最適化を回して」 | 計測→診断→提案→承認→実装→検証→再計測のイテレーションループ |
| **perf-guard-ci** | 「変更チェックして」「コミットして大丈夫？」 | git diff → リスク判定 → リスクレベル別検証 → SAFE/WARNING/BLOCKED 判定 |
| **perf-report** | 「進捗まとめて」「何が効いた？」 | 全計測結果と実験ログを横断してスコア推移・施策効果をレポート |

配点ウェイト（施策の優先度判断に使う）: TBT:30, LCP:25, CLS:25, FCP:10, SI:10

## 最初に確認すること

改善に着手する前に、以下を優先順で確認する。

1. **配点と失点の大きいメトリクス** (9ページ×100点 + 5フロー×50点)
2. **Webpack 最適化の有効化** (minimize, splitChunks, tree-shaking, mode: production)
3. **不要な polyfill・重量級依存の除去** (core-js, jQuery, lodash, moment, FFmpeg, ImageMagick, Web-LLM)
4. **Babel ターゲットの近代化** (IE 11 → モダンブラウザ)
5. **Tailwind CSS の CDN 読み込みをビルド時に変更**
6. **inline-source-map の除去**
7. **静的ファイルの圧縮・キャッシュ設定** (gzip/brotli, Cache-Control, ETag)
8. **レギュレーションを壊していないか**

## やってはいけない最適化

- **VRT を壊すような見た目変更を入れない**
- **手動テスト項目の機能を壊さない** (`docs/test_cases.md`)
- **Crok の SSE プロトコルを変更しない**
- **シード ID を変更しない**
- **fly.toml を変更しない**
- **単発の Lighthouse スコアだけで効果判定しない**

## ルート別の見どころ

- **ホーム (`/`)**
  - タイムライン表示、動画自動再生、音声波形、写真表示
  - 初期ロード JS の巨大さ (全依存が単一バンドル)
- **投稿詳細 (`/posts/:postId`)**
  - 動画/音声/写真それぞれのメディア処理
  - 翻訳機能 (Web-LLM が初期バンドルに混入する可能性)
- **DM (`/dm`, `/dm/:conversationId`)**
  - WebSocket リアルタイム通信
  - 未読バッジ、入力中インジケータ
- **検索 (`/search`)**
  - BM25 検索 (kuromoji 辞書ロード)
  - 感情分析 (negaposi-analyzer 辞書ロード)
  - 無限スクロール
- **Crok (`/crok`)**
  - SSE ストリーミング
  - Markdown レンダリング (react-syntax-highlighter, KaTeX)
  - サジェスト機能
- **利用規約 (`/terms`)**
  - 源ノ明朝フォント表示

## 計測時の注意

- Lighthouse の単発値はぶれるので、前回差分とメトリクスの絶対値も見る
- 実装後は `perf-validate` で build / regulation / VRT を先に確認する
- scoring-tool を使えばローカルで本番同等の採点ができる
- ページ表示300点未満ではフロー採点が行われないので、まずランディング改善を優先する
