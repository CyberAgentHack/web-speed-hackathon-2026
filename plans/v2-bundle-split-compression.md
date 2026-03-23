# Plan: v2 — バンドル分割 + Backend 圧縮

## Context

v1 で webpack production モードを有効にし main.js を 108MB → 72MB に削減したが、FCP/LCP/SI は依然 0点。
72MB の **単一バンドル** をブラウザが全てダウンロード・パース・実行するまで何も描画できないのが原因。

**目標**: main.js の初期ロードを数MB以下にし、FCP/LCP/SI にスコアをつけ、表示スコア 300点超え（= ユーザーフロー計測の解放）を達成する。

## 戦略: なぜこの2つを同時にやるか

| 施策 | 効果 | 単独では不十分な理由 |
|------|------|---------------------|
| **バンドル分割** (Frontend) | main.js 72MB → 初期ロード数MB | 分割しても非圧縮だと転送時間が長い |
| **gzip 圧縮** (Backend) | 転送サイズを 1/3〜1/5 に | 72MB を圧縮しても巨大なまま |

両方やって初めて「小さいファイルを圧縮して高速転送」が実現する。

## 施策 1: バンドル分割 (Frontend)

### 現状の問題

main.js 72MB の内訳（主要な重量物）:

| モジュール | サイズ目安 | 使用場所 | 初期ロードに必要か |
|-----------|----------|---------|------------------|
| @ffmpeg/core WASM | ~30MB | 投稿時の動画/音声変換 (`load_ffmpeg.ts`) | **不要** |
| @imagemagick/magick-wasm | ~15MB | 投稿時の画像変換 (`convert_image.ts`) | **不要** |
| @mlc-ai/web-llm | ~13MB | 翻訳ボタン押下時 (`create_translator.ts`) | **不要** |
| kuromoji | ~39MB | チャットサジェスト・検索ネガポジ (`ChatInput.tsx`, `negaposi_analyzer.ts`) | **不要** |
| react-syntax-highlighter + highlight.js | ~11MB | Crok チャットのみ (`CodeBlock.tsx`) | **不要** |
| katex | ~4MB | Crok チャットのみ (`ChatMessage.tsx`) | **不要** |

**ポイント**: 初期表示（ホームのタイムライン）に本当に必要なのは React + React Router + 基本 UI だけ。

### 変更内容

#### 1-1. splitChunks 有効化 + chunkFormat 修正

**なぜ**: `splitChunks: false` で全コードが1ファイルに結合。`chunkFormat: false` でチャンク出力が無効化。

```js
// webpack.config.js
optimization: {
  splitChunks: { chunks: "all" },  // false → { chunks: "all" }
},
output: {
  chunkFormat: "array-push",       // false → "array-push"
}
```

#### 1-2. WASM バイナリをバンドルから分離

**なぜ**: `?binary` (asset/bytes) で WASM が base64 化されて main.js に埋め込まれている。72MB の最大原因。

```js
// webpack.config.js の rules
{
  resourceQuery: /binary/,
  type: "asset/resource",             // asset/bytes → asset/resource
  generator: { filename: "assets/[name][ext]" },
}
```

修正が必要なソースファイル:
- `client/src/utils/load_ffmpeg.ts` — import で URL が返るようになるので、coreURL/wasmURL にそのまま渡す
- `client/src/utils/convert_image.ts` — magickWasm を fetch → ArrayBuffer で取得して initializeImageMagick に渡す

#### 1-3. 重量モジュールの動的 import (React.lazy)

**なぜ**: Crok チャット、投稿モーダル、翻訳など初期表示に不要な機能がトップレベル import。

```tsx
// ルーティング定義で
const CrokChatPage = React.lazy(() => import("./pages/CrokChatPage"));
const NewPostModalPage = React.lazy(() => import("./pages/NewPostModalPage"));
```

これにより katex, react-syntax-highlighter, kuromoji, ffmpeg, magick-wasm 等が別チャンクに分離。

## 施策 2: Backend レスポンス圧縮

### 現状の問題

Express サーバーが静的ファイルを **非圧縮** で配信。

### 変更内容

```ts
import compression from "compression";
app.use(compression());
```

`compression` パッケージを追加。全レスポンスに gzip 圧縮がかかり、JS/CSS/JSON/HTML は 1/3〜1/5 に。

## 修正対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `application/client/webpack.config.js` | splitChunks 有効化, chunkFormat 修正, asset/resource 化 |
| `application/client/src/utils/load_ffmpeg.ts` | WASM URL ベースのロードに修正 |
| `application/client/src/utils/convert_image.ts` | WASM URL ベースのロードに修正 |
| `application/client/src/index.tsx` (またはルーティング定義) | React.lazy によるルート分割 |
| `application/server/src/index.ts` (Express app 設定) | compression ミドルウェア追加 |
| `application/server/package.json` | compression パッケージ追加 |

## 期待効果

| 指標 | v1 (現状) | v2 (予想) |
|------|----------|----------|
| main.js サイズ | 72 MB | ~2-5 MB (初期チャンク) |
| main.js 転送サイズ (gzip) | 72 MB | ~500KB-1.5MB |
| FCP | 90秒 (0点) | 数秒以内 (スコアあり) |
| 表示スコア合計 | 240点 | 300点超え見込み |
| ユーザーフロー | スキップ | 計測可能に |

## リスク・注意点

- **機能落ちリスク**: WASM のロード方法変更で動画/画像/音声変換が壊れる可能性 → VRT + 手動で投稿機能を確認
- **React.lazy の Suspense**: fallback が必要。既存の見た目を崩さないよう最小限の fallback にする
- **compression の CPU 負荷**: fly.io の小さい VM では影響ありうるが、転送量削減のメリットが上回る

## 検証手順

1. `cd application && pnpm run build` — ビルド成功・チャンク分割の確認
2. `ls -lh dist/scripts/` — main.js サイズと分割チャンクの確認
3. サーバー再起動して `http://localhost:3000/` で動作確認
4. scoring-tool: `cd scoring-tool && pnpm start --applicationUrl http://localhost:3000`
5. VRT: `cd application/e2e && pnpm run test:update 2>&1 | tee ../../regression/v2-local-bundle-split-compression.txt`
6. 全テスト passed を確認後、commit & push
