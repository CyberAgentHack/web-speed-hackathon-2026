# チューニング前アーキテクチャ

このドキュメントは Web Speed Hackathon 2026 (CaX) のチューニング開始前のアーキテクチャを記録したものである。
意図的に仕込まれたパフォーマンスボトルネックを含む初期状態を正確に記録し、チューニング後との比較に用いる。

---

## 全体構成

```
application/
  client/          ... フロントエンド (SPA)
  server/          ... バックエンド (Express + SQLite)
  public/          ... 静的アセット (365MB)
  dist/            ... ビルド成果物 (109MB)
  upload/          ... ユーザーアップロードファイル
scoring-tool/      ... 採点ツール (Lighthouse ベース)
docs/              ... コンペドキュメント
```

- ランタイム: Node.js 24.14.0
- パッケージマネージャ: pnpm 10.32.1 (pnpm workspaces)
- ツール管理: mise-en-place

---

## Frontend

### ビルドツールチェーン

| 項目 | 設定 | ファイル |
|------|------|----------|
| バンドラ | webpack 5.102.1 | `client/webpack.config.js` |
| トランスパイラ | Babel (babel-loader 10.0.0) | `client/babel.config.js` |
| CSS 処理 | PostCSS + MiniCssExtractPlugin | `client/postcss.config.js` |
| 型チェック | TypeScript 5.9.3 (noEmit) | `client/tsconfig.json` |

### webpack 設定 (`client/webpack.config.js`)

#### モードと最適化

```js
mode: "none",                    // production でも development でもない
devtool: "inline-source-map",    // ソースマップがバンドルに埋め込まれる
cache: false,                    // ビルドキャッシュ無効
optimization: {
  minimize: false,               // ミニファイ無効
  splitChunks: false,            // コード分割無効
  concatenateModules: false,     // モジュール連結無効
  usedExports: false,            // tree-shaking 無効
  providedExports: false,        // エクスポート解析無効
  sideEffects: false,            // 副作用解析無効
}
```

全ての最適化が明示的に無効化されている。

#### エントリポイント

```js
entry: {
  main: [
    "core-js",                   // Polyfill (全モジュール)
    "regenerator-runtime/runtime",
    "jquery-binarytransport",
    "./src/index.css",
    "./src/buildinfo.ts",
    "./src/index.tsx",
  ],
}
```

単一エントリに全てが含まれ、`scripts/main.js` (108MB) として出力される。

#### ProvidePlugin によるグローバル注入

```js
new webpack.ProvidePlugin({
  $: "jquery",                               // jQuery をグローバル注入 (85KB)
  AudioContext: ["standardized-audio-context", "AudioContext"],
  Buffer: ["buffer", "Buffer"],
  "window.jQuery": "jquery",
})
```

#### EnvironmentPlugin

```js
new webpack.EnvironmentPlugin({
  NODE_ENV: "development",   // 本番ビルドでも development に固定
})
```

React の開発モード警告やライブラリの development ブランチがバンドルに含まれる。

#### resolve.alias

```js
alias: {
  "bayesian-bm25$":                    "bayesian-bm25/dist/index.js",
  "kuromoji$":                         "kuromoji/build/kuromoji.js",
  "@ffmpeg/ffmpeg$":                   "@ffmpeg/ffmpeg/dist/esm/index.js",
  "@ffmpeg/core$":                     "@ffmpeg/core/dist/umd/ffmpeg-core.js",
  "@ffmpeg/core/wasm$":                "@ffmpeg/core/dist/umd/ffmpeg-core.wasm",
  "@imagemagick/magick-wasm/magick.wasm$": "@imagemagick/magick-wasm/dist/magick.wasm",
}
```

WASM バイナリ (ffmpeg-core.wasm, magick.wasm) がメインバンドルに組み込まれる。

#### CopyWebpackPlugin

KaTeX フォント (60ファイル, 約1MB) を `node_modules/katex/dist/fonts` から `dist/styles/fonts/` にコピー。

### Babel 設定 (`client/babel.config.js`)

```js
presets: [
  ["@babel/preset-typescript"],
  ["@babel/preset-env", {
    targets: "ie 11",          // IE 11 をターゲット (大量のPolyfill生成)
    corejs: "3",
    modules: "commonjs",       // ES modules → CommonJS 変換 (webpack tree-shaking を阻害)
    useBuiltIns: false,        // Polyfill 自動注入しない (エントリで core-js 全体読み込み)
  }],
  ["@babel/preset-react", {
    development: true,         // React 開発モード固定
    runtime: "automatic",
  }],
]
```

**問題点:**
- `modules: "commonjs"` により webpack の tree-shaking が機能しない
- `targets: "ie 11"` により不要なトランスパイルが大量に発生
- `development: true` により React の開発警告コードがバンドルに残る

### ビルドスクリプト (`client/package.json`)

```json
"build": "NODE_ENV=development webpack"
```

環境変数レベルでも `development` が設定される。

### ビルド出力

| ファイル | サイズ |
|----------|--------|
| `dist/scripts/main.js` | **108 MB** |
| `dist/styles/main.css` | 82.4 KB |
| `dist/styles/fonts/` (KaTeX) | 約 1 MB |
| `dist/index.html` | 5 KB |
| **dist/ 合計** | **109 MB** |

### HTML テンプレート (`client/src/index.html`)

```html
<script src="/scripts/main.js"></script>                                        <!-- 108MB, 同期ロード -->
<link rel="stylesheet" href="/styles/main.css" />
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.2.1"></script> <!-- Tailwind CDN ランタイム -->
<style type="text/tailwindcss">...</style>                                      <!-- ランタイム CSS 処理 -->
```

**問題点:**
- `main.js` が `defer` / `async` なしで同期読み込み (108MB)
- Tailwind CSS がブラウザ側で CDN ランタイムにより処理される (ビルド時生成ではない)
- カスタムテーマとユーティリティが `<style type="text/tailwindcss">` でランタイム処理

### CSS 構成

| レイヤー | 方法 | 詳細 |
|----------|------|------|
| リセット | normalize.css | `index.css` で `@import` |
| ユーティリティ | Tailwind CSS v4 (CDN) | ブラウザランタイムコンパイル |
| コンポーネント | PostCSS + postcss-preset-env (stage 3) | MiniCssExtractPlugin で抽出 |
| フォント | `@font-face` (index.css) | `font-display: block` (FOIT 発生) |

#### フォント定義

```css
@font-face {
  font-display: block;                        /* block → テキスト非表示でフォント待ち */
  font-family: "Rei no Are Mincho";
  src: url("/fonts/...") format("opentype");  /* 利用規約ページ用カスタムフォント */
}
```

KaTeX フォント (60ファイル) も `font-display: block` で読み込まれる。

### エントリポイント (`client/src/index.tsx`)

```tsx
window.addEventListener("load", () => {
  createRoot(document.getElementById("app")!).render(
    <Provider store={store}>
      <BrowserRouter>
        <AppContainer />
      </BrowserRouter>
    </Provider>,
  );
});
```

- `load` イベント待ち: 全リソース (108MB main.js 含む) ロード後に React マウント
- コード分割なし: 全ルートが即座にインポートされる

### ルーティング (`client/src/containers/AppContainer.tsx`)

React Router v7 による SPA。全ルートコンポーネントが eager import される。

```
/                    → TimelineContainer
/dm                  → DirectMessageListContainer
/dm/:conversationId  → DirectMessageContainer
/search              → SearchContainer
/users/:username     → UserProfileContainer
/posts/:postId       → PostContainer
/terms               → TermContainer
/crok                → CrokContainer
*                    → NotFoundContainer
```

`React.lazy()` や `import()` による遅延ロードは一切使われていない。

### 状態管理

```ts
// client/src/store/index.ts
const rootReducer = combineReducers({ form: formReducer });
export const store = createStore(rootReducer);
```

- Redux 5.0.1 + react-redux 9.2.0 + redux-form 8.3.10
- フォームのバリデーション状態管理のみに使用
- 非推奨の `createStore` API を使用

### 依存パッケージ (パフォーマンス影響大)

| パッケージ | バージョン | 推定サイズ | 用途 | 使用箇所 |
|-----------|-----------|-----------|------|----------|
| `@ffmpeg/core` | 0.12.10 | **~30 MB (WASM)** | 動画/音声処理 | 投稿作成時 |
| `@imagemagick/magick-wasm` | 0.0.37 | **~数 MB (WASM)** | 画像処理 | 投稿作成時 |
| `@mlc-ai/web-llm` | 0.2.80 | **巨大 (LLM)** | 投稿翻訳 (on-device) | PostContainer |
| `kuromoji` | 0.1.2 | **~4 MB (辞書)** | 日本語トークナイズ | 検索 (BM25) |
| `negaposi-analyzer-ja` | 1.0.1 | **~3.3 MB (辞書)** | ネガポジ判定 | 検索 |
| `react-syntax-highlighter` | 16.1.0 | **~200 KB+** | コードハイライト | Crok チャット (1コンポーネント) |
| `katex` | 0.16.25 | **~100 KB+** | 数式レンダリング | Crok チャット |
| `jquery` | 3.7.1 | **~85 KB** | DOM操作/Ajax | ProvidePlugin (最小限の使用) |
| `bluebird` | 3.7.2 | **~76 KB** | Promise ライブラリ | 2ファイルで使用 |
| `lodash` | 4.17.21 | **~70 KB** | ユーティリティ | 2ファイル (`zipWith`, `filter`, `sortBy` 等) |
| `moment` | 2.30.1 | **~67 KB** | 日時フォーマット | 6ファイルで使用 |
| `redux-form` | 8.3.10 | **~50 KB** | フォーム状態管理 | 認証/投稿フォーム |
| `core-js` | 3.45.1 | **~大** | Polyfill (全量) | エントリで全量読み込み |
| `standardized-audio-context` | 25.3.77 | - | AudioContext polyfill | ProvidePlugin |
| `buffer` | 6.0.3 | - | Buffer polyfill | ProvidePlugin |

### クライアントサイド処理

以下の重い処理がブラウザ上で行われている:

1. **動画処理**: FFmpeg WASM で MKV→GIF 変換、5秒切り抜き、正方形クロップ (投稿時)
2. **画像処理**: ImageMagick WASM で TIFF→JPEG 変換 (投稿時)
3. **音声処理**: FFmpeg WASM で WAV→MP3 変換 (投稿時)
4. **翻訳**: @mlc-ai/web-llm でオンデバイス LLM 翻訳 (投稿詳細の Show Translation)
5. **検索ランキング**: kuromoji + bayesian-bm25 によるクライアントサイド BM25 検索
6. **ネガポジ判定**: negaposi-analyzer-ja でクライアントサイドの感情分析 (検索時)
7. **音声波形描画**: SoundWaveSVG コンポーネントで SVG レンダリング

### 静的アセット (`public/`)

| ディレクトリ | サイズ | 内容 |
|-------------|--------|------|
| `public/movies/` | **179 MB** | 動画ファイル |
| `public/images/` | **89 MB** | 画像ファイル |
| `public/sounds/` | **66 MB** | 音声ファイル |
| `public/dicts/` | **17 MB** | kuromoji 辞書 (.dat.gz) |
| `public/fonts/` | **13 MB** | フォントファイル |
| `public/sprites/` | **1.2 MB** | SVG スプライト |
| **合計** | **~365 MB** | |

これらは最適化・圧縮されていない状態でそのまま配信される。

---

## Backend

### フレームワーク構成

| 項目 | 技術 | バージョン |
|------|------|-----------|
| Web フレームワーク | Express | 5.1.0 |
| ORM | Sequelize | 6.37.7 |
| データベース | SQLite3 | 5.1.7 |
| セッション | express-session (MemoryStore) | 1.18.2 |
| WebSocket | ws | 8.18.3 |
| ランタイム | tsx (ts-node 代替) | 4.20.6 |

### エントリポイント (`server/src/index.ts`)

```ts
async function main() {
  await initializeSequelize();
  app.listen(Number(process.env["PORT"] || 3000), "0.0.0.0");
}
```

### ミドルウェアスタック (`server/src/app.ts`)

```ts
app.set("trust proxy", true);

app.use(sessionMiddleware);               // express-session (MemoryStore)
app.use(bodyParser.json());               // JSON ボディ
app.use(bodyParser.raw({ limit: "10mb" })); // バイナリボディ (ファイルアップロード用)

app.use((_req, res, next) => {
  res.header({
    "Cache-Control": "max-age=0, no-transform",  // キャッシュ完全無効
    Connection: "close",                           // Keep-Alive 無効
  });
  return next();
});

app.use("/api/v1", apiRouter);
app.use(staticRouter);
```

**問題点:**
- `Cache-Control: max-age=0` で全レスポンスのブラウザキャッシュを無効化
- `Connection: close` で HTTP Keep-Alive を無効化 (毎回 TCP 接続を切断)
- 圧縮ミドルウェア (gzip/brotli) が一切ない

### 静的ファイル配信 (`server/src/routes/static.ts`)

```ts
staticRouter.use(history());  // SPA フォールバック

staticRouter.use(serveStatic(UPLOAD_PATH, { etag: false, lastModified: false }));
staticRouter.use(serveStatic(PUBLIC_PATH, { etag: false, lastModified: false }));
staticRouter.use(serveStatic(CLIENT_DIST_PATH, { etag: false, lastModified: false }));
```

**問題点:**
- `etag: false` で ETag ヘッダ無効 (304 Not Modified 応答不可)
- `lastModified: false` で Last-Modified ヘッダ無効
- 圧縮なしで 365MB の静的アセット + 108MB の main.js をそのまま配信

### データベース (`server/src/sequelize.ts`)

```ts
export async function initializeSequelize() {
  const TEMP_PATH = path.resolve(
    await fs.mkdtemp(path.resolve(os.tmpdir(), "./wsh-")),
    "./database.sqlite",
  );
  await fs.copyFile(DATABASE_PATH, TEMP_PATH);  // 初期DBをtempにコピー

  _sequelize = new Sequelize({
    dialect: "sqlite",
    logging: false,
    storage: TEMP_PATH,
  });
  initModels(_sequelize);
}
```

初期化のたびに `database.sqlite` を一時ディレクトリにコピーして使用する。

### データモデル (11モデル)

| モデル | テーブル | 主な用途 |
|--------|---------|---------|
| `User` | ユーザー | 認証、プロフィール |
| `Post` | 投稿 | タイムライン、検索 |
| `Comment` | コメント | 投稿へのコメント |
| `Image` | 画像 | 投稿添付画像 |
| `Movie` | 動画 | 投稿添付動画 |
| `Sound` | 音声 | 投稿添付音声 |
| `ProfileImage` | プロフィール画像 | ユーザーアイコン |
| `PostsImagesRelation` | 中間テーブル | Post-Image 多対多 |
| `DirectMessage` | DM | ダイレクトメッセージ |
| `DirectMessageConversation` | DM会話 | DM のスレッド管理 |
| `QaSuggestion` | Q&A候補 | Crok のサジェスト |

### リレーション構造

```
User ──1:N──> Post ──M:N──> Image
  │             │──1:1──> Movie
  │             │──1:1──> Sound
  │             └──1:N──> Comment ──N:1──> User
  │
  ├──1:1──> ProfileImage
  │
  ├──1:N──> DirectMessageConversation (initiator)
  ├──1:N──> DirectMessageConversation (member)
  │             └──1:N──> DirectMessage ──N:1──> User (sender)
  │
  └──1:N──> DirectMessage (sender)
```

### defaultScope による eager loading

全モデルに `defaultScope` が設定され、クエリ時に必ず関連テーブルを JOIN する:

**Post モデル:**
```ts
defaultScope: {
  attributes: { exclude: ["userId", "movieId", "soundId"] },
  include: [
    { association: "user",   include: [{ association: "profileImage" }] },
    { association: "images", through: { attributes: [] } },
    { association: "movie" },
    { association: "sound" },
  ],
  order: [["id", "DESC"], ["images", "createdAt", "ASC"]],
}
```

**User モデル:**
```ts
defaultScope: {
  attributes: { exclude: ["profileImageId"] },
  include: { association: "profileImage" },
}
```

**DirectMessage モデル:**
```ts
defaultScope: {
  include: [{ association: "sender", include: [{ association: "profileImage" }] }],
  order: [["createdAt", "ASC"]],
}
```

**問題点:**
- 全クエリで関連テーブルを常に JOIN → 不要なデータまで毎回取得
- Post の一覧取得時に user + profileImage + images + movie + sound を全て JOIN
- インデックスが主キーと `username` の UNIQUE 制約のみ
- `userId`, `postId`, `conversationId`, `senderId`, `createdAt` 等の頻出カラムにインデックスなし

### API ルート構造

| パス | メソッド | 処理内容 |
|------|---------|---------|
| `/api/v1/initialize` | POST | DB リセット + セッションクリア + upload 削除 |
| `/api/v1/posts` | GET | 投稿一覧 (ページネーション対応) |
| `/api/v1/posts/:postId` | GET | 投稿詳細 |
| `/api/v1/posts/:postId/comments` | GET | コメント一覧 (ページネーション) |
| `/api/v1/posts` | POST | 投稿作成 |
| `/api/v1/me` | GET | ログインユーザー情報 |
| `/api/v1/me` | PUT | プロフィール更新 |
| `/api/v1/users/:username` | GET | ユーザー詳細 |
| `/api/v1/users/:username/posts` | GET | ユーザーの投稿一覧 |
| `/api/v1/signup` | POST | ユーザー登録 |
| `/api/v1/signin` | POST | サインイン |
| `/api/v1/signout` | POST | サインアウト |
| `/api/v1/search` | GET | 投稿検索 (テキスト + 日付) |
| `/api/v1/images` | POST | 画像アップロード (JPEG) |
| `/api/v1/movies` | POST | 動画アップロード (GIF) |
| `/api/v1/sounds` | POST | 音声アップロード (MP3) |
| `/api/v1/dm` | GET | DM 会話一覧 |
| `/api/v1/dm` | POST | DM 会話作成 |
| `/api/v1/dm/:conversationId` | GET | DM 会話詳細 |
| `/api/v1/dm/:conversationId` | WS | DM リアルタイム (WebSocket) |
| `/api/v1/dm/:conversationId/messages` | POST | DM 送信 |
| `/api/v1/dm/:conversationId/read` | POST | 既読処理 |
| `/api/v1/dm/:conversationId/typing` | POST | 入力中通知 |
| `/api/v1/dm/unread` | WS | 未読数リアルタイム (WebSocket) |
| `/api/v1/crok/suggestions` | GET | Crok サジェスト一覧 |
| `/api/v1/crok` | GET | Crok AI レスポンス (SSE) |

### 検索 API (`server/src/routes/api/search.ts`)

```ts
// 1. テキスト検索
const postsByText = await Post.findAll({ where: { text: { [Op.like]: `%${keywords}%` } }, limit, offset });

// 2. ユーザー名/名前検索
const postsByUser = await Post.findAll({
  include: [{ association: "user", required: true, where: { [Op.or]: [...] } }],
  limit, offset,
});

// 3. メモリ上でマージ・重複排除・ソート・スライス
const mergedPosts = [...postsByText, ...postsByUser];
mergedPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
const result = mergedPosts.slice(offset || 0, (offset || 0) + (limit || mergedPosts.length));
```

**問題点:**
- 2回の DB クエリを発行し、結果をメモリ上でマージ
- `LIKE '%keyword%'` は前方一致でないためインデックスが効かない
- ソートとページネーションを JS 側で再実行 (DB に任せるべき)
- `offset` を DB クエリとメモリスライスの両方に適用する二重処理

### Crok SSE エンドポイント (`server/src/routes/api/crok.ts`)

```ts
// 固定テキスト (crok-response.md) を1文字ずつストリーミング
await sleep(3000);                    // 3秒の人工遅延 (TTFT)
for (const char of response) {
  res.write(`event: message\nid: ${messageId++}\ndata: ${data}\n\n`);
  await sleep(10);                    // 1文字あたり 10ms の遅延
}
```

**問題点:**
- 3000ms の初期遅延
- 1文字ずつ 10ms 間隔 → レスポンス全体の配信に非常に長い時間がかかる
- 実際の LLM ではなく固定テキストを配信

### DM の afterSave フック (`server/src/models/DirectMessage.ts`)

```ts
DirectMessage.addHook("afterSave", "onDmSaved", async (message) => {
  const directMessage = await DirectMessage.findByPk(message.get().id);
  const conversation = await DirectMessageConversation.findByPk(directMessage?.conversationId);
  const unreadCount = await DirectMessage.count({
    distinct: true,
    where: { senderId: { [Op.ne]: receiverId }, isRead: false },
    include: [{ association: "conversation", where: { [Op.or]: [...] }, required: true }],
  });
  eventhub.emit(`dm:conversation/${conversation.id}:message`, directMessage);
  eventhub.emit(`dm:unread/${receiverId}`, { unreadCount });
});
```

**問題点:**
- 保存のたびに 3つの DB クエリを実行 (findByPk × 2 + count)
- unreadCount の集計クエリが重い (JOIN + WHERE + COUNT DISTINCT)

### セッション管理 (`server/src/session.ts`)

```ts
export const sessionStore = new MemoryStore();
export const sessionMiddleware = session({
  store: sessionStore,
  secret: "secret",         // ハードコード秘密鍵
  resave: false,
  saveUninitialized: false,
});
```

- MemoryStore 使用 (再起動でセッション消失)
- 秘密鍵がハードコード

### メディアアップロード

| 種別 | 受け付ける形式 | 保存形式 | 保存先 |
|------|--------------|---------|--------|
| 画像 | JPEG (raw body) | UUID.jpg | `/upload/images/` |
| 動画 | GIF (raw body) | UUID.gif | `/upload/movies/` |
| 音声 | MP3 (raw body) | UUID.mp3 | `/upload/sounds/` |

- クライアント側で形式変換 (TIFF→JPEG, MKV→GIF, WAV→MP3) を WASM で実行
- サーバーは変換済みファイルをそのまま保存
- ファイル全体をメモリに読み込んでからバリデーション
- リサイズ・最適化なし

---

## パフォーマンスボトルネック総括

### Frontend (影響度: 極大)

| カテゴリ | 問題 | 影響指標 |
|---------|------|---------|
| バンドルサイズ | main.js が 108MB (非圧縮、非ミニファイ) | FCP, LCP, SI, TBT |
| ビルド設定 | mode=none, minimize=false, tree-shaking=false | 全指標 |
| 環境変数 | NODE_ENV=development 固定 | バンドルサイズ |
| ソースマップ | inline-source-map (バンドルに埋め込み) | バンドルサイズ |
| Babel | modules=commonjs (tree-shaking 阻害), targets=ie11 | バンドルサイズ |
| コード分割 | splitChunks=false, React.lazy 未使用 | FCP, LCP |
| Tailwind | CDN ランタイム処理 | FCP, TBT |
| フォント | font-display: block (FOIT) | FCP, CLS |
| Polyfill | core-js 全量読み込み | バンドルサイズ |
| 重量ライブラリ | ffmpeg WASM, kuromoji 辞書がメインバンドルに同梱 | 初期ロード |
| レガシーライブラリ | jQuery, Bluebird, moment, lodash が全量バンドル | バンドルサイズ |
| スクリプトロード | `<script src="main.js">` 同期読み込み (defer/async なし) | FCP, LCP |

### Backend (影響度: 大)

| カテゴリ | 問題 | 影響指標 |
|---------|------|---------|
| 圧縮 | gzip/brotli 圧縮なし | 転送サイズ → FCP, LCP |
| キャッシュ | Cache-Control: max-age=0, ETag 無効, lastModified 無効 | 再訪問速度 |
| 接続 | Connection: close (Keep-Alive 無効) | TTFB |
| DB インデックス | 主キー以外のインデックスなし | API レスポンス時間 |
| eager loading | defaultScope で全リレーション常時 JOIN | API レスポンス時間 |
| 検索 | 2クエリ + メモリマージ + LIKE '%keyword%' | 検索レスポンス |
| Crok SSE | 3秒初期遅延 + 10ms/文字 | TBT, INP |
| DM フック | 保存ごとに 3クエリ (findByPk×2 + count) | DM レスポンス |
| 静的アセット | 画像/動画/音声が未最適化のまま配信 (365MB) | LCP |
