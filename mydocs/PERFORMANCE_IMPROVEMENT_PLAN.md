# Web Speed Hackathon 2026 パフォーマンス改善計画

## 現状スコア: 288.25点 / 900点満点

---

## 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [Webpack設定の問題](#2-webpack設定の問題)
3. [依存関係の問題](#3-依存関係の問題)
4. [メディア処理の問題](#4-メディア処理の問題)
5. [CSS・フォントの問題](#5-cssフォントの問題)
6. [Reactコンポーネントの問題](#6-reactコンポーネントの問題)
7. [サーバーサイドの問題](#7-サーバーサイドの問題)
8. [改善優先度マトリックス](#8-改善優先度マトリックス)
9. [具体的な修正手順](#9-具体的な修正手順)

---

## 1. エグゼクティブサマリー

### 根本原因

| カテゴリ | 問題 | 影響度 |
|---------|------|--------|
| **Webpack** | 最適化が全て無効化されている | 致命的 |
| **バンドルサイズ** | 108MB (本来は5-10MB以下) | 致命的 |
| **メディア** | GIF 179MB、画像 89MB、最適化なし | 致命的 |
| **フォント** | 12.6MB のカスタムフォント | 高 |
| **サーバー** | 圧縮なし、キャッシュ無効 | 高 |
| **React** | 遅延読み込みなし、無駄な処理 | 高 |

### 期待される改善効果

| 修正項目 | 削減効果 |
|---------|---------|
| Webpack最適化有効化 | 108MB → 15-20MB (85%削減) |
| コード分割 | 初期ロード 50-70%削減 |
| GIF→WebM変換 | 179MB → 18MB (90%削減) |
| 画像最適化 | 89MB → 30MB (65%削減) |
| フォント最適化 | 12.6MB → 1MB (92%削減) |
| gzip圧縮 | 全体 60-70%削減 |

---

## 2. Webpack設定の問題

### 2.1 致命的: 最適化が全て無効

**ファイル**: `application/client/webpack.config.js`

```javascript
// 現在の設定 (Lines 131-136)
optimization: {
  minimize: false,           // ❌ ミニファイ無効
  splitChunks: false,        // ❌ コード分割無効
  usedExports: false,        // ❌ ツリーシェイキング無効
  providedExports: false,    // ❌ エクスポート解析無効
  sideEffects: false,        // ❌ 副作用解析無効
  concatenateModules: false, // ❌ モジュール結合無効
}
```

### 2.2 致命的: ビルドモードが"none"

**ファイル**: `application/client/webpack.config.js` (Line 39)

```javascript
mode: "none",  // ❌ 最適化プラグインが全て無効
```

**ファイル**: `application/client/package.json` (Line 8)

```json
"build": "NODE_ENV=development webpack"  // ❌ 開発モードでビルド
```

### 2.3 高: インラインソースマップ

**ファイル**: `application/client/webpack.config.js` (Line 28)

```javascript
devtool: "inline-source-map",  // ❌ ソースマップがバンドルに埋め込まれる
```

### 2.4 高: core-js全体をバンドル

**ファイル**: `application/client/webpack.config.js` (Lines 31-32)

```javascript
entry: {
  main: [
    "core-js",                        // ❌ 15MB全体をバンドル
    "regenerator-runtime/runtime",
    ...
  ]
}
```

### 修正方法

```javascript
// webpack.config.js
module.exports = {
  mode: "production",
  devtool: false,  // または "source-map" (外部ファイル)
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          priority: 10,
        },
      },
    },
    usedExports: true,
    providedExports: true,
    sideEffects: true,
    concatenateModules: true,
  },
};
```

```javascript
// babel.config.js - core-jsを必要な分だけ
["@babel/preset-env", {
  useBuiltIns: "usage",  // 必要なポリフィルのみ
  corejs: 3,
  targets: "> 0.5%, last 2 versions, not dead",  // IE11サポートを削除
}]
```

---

## 3. 依存関係の問題

### 3.1 致命的: 削除すべき依存関係

| パッケージ | サイズ | 使用箇所 | 代替案 |
|-----------|--------|---------|--------|
| **jQuery** | 85KB | 4箇所 (AJAX) | `fetch` API |
| **lodash** | 72KB | 7箇所 | ネイティブJS |
| **moment** | 67KB | 10箇所 | `date-fns` or `Intl` |
| **Bluebird** | 20KB | 4箇所 | ネイティブPromise |

### 3.2 jQuery削除

**ファイル**: `application/client/src/utils/fetchers.ts`

```typescript
// 現在 (jQuery)
export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const result = await $.ajax({
    async: false,  // ❌ 同期処理
    dataType: "binary",
    method: "GET",
    responseType: "arraybuffer",
    url,
  });
  return result;
}

// 修正後 (fetch API)
export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  return response.arrayBuffer();
}
```

### 3.3 moment削除

**使用ファイル**:
- `components/user_profile/UserProfileHeader.tsx`
- `components/post/CommentItem.tsx`
- `components/post/PostItem.tsx`
- `components/timeline/TimelineItem.tsx`
- `components/direct_message/DirectMessagePage.tsx`
- `components/direct_message/DirectMessageListPage.tsx`

```typescript
// 現在
import moment from "moment";
moment(date).locale("ja").format("LL")

// 修正後 (Intl API - 依存なし)
new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric"
}).format(new Date(date))
```

### 3.4 lodash削除

**ファイル**: `application/client/src/components/foundation/SoundWaveSVG.tsx`

```typescript
// 現在
import _ from "lodash";
const leftData = _.map(buffer.getChannelData(0), Math.abs);
const normalized = _.map(_.zip(leftData, rightData), _.mean);
const chunks = _.chunk(normalized, Math.ceil(normalized.length / 100));
const peaks = _.map(chunks, _.mean);
const max = _.max(peaks) ?? 0;

// 修正後 (ネイティブJS)
const leftData = Array.from(buffer.getChannelData(0), Math.abs);
const rightData = Array.from(buffer.getChannelData(1), Math.abs);
const normalized = leftData.map((l, i) => (l + rightData[i]) / 2);
const chunkSize = Math.ceil(normalized.length / 100);
const peaks = Array.from({ length: 100 }, (_, i) => {
  const chunk = normalized.slice(i * chunkSize, (i + 1) * chunkSize);
  return chunk.reduce((a, b) => a + b, 0) / chunk.length;
});
const max = Math.max(...peaks);
```

### 3.5 巨大WASM/MLライブラリの遅延読み込み

| パッケージ | サイズ | 問題 |
|-----------|--------|------|
| @ffmpeg/core | 62MB | 初期ロード |
| @mlc-ai/web-llm | 13MB | 初期ロード |
| @imagemagick/magick-wasm | 15MB | 初期ロード |
| kuromoji | 39MB | 辞書含む |

```typescript
// 現在: グローバルインポート
import { FFmpeg } from "@ffmpeg/ffmpeg";

// 修正後: 動的インポート
const loadFFmpeg = async () => {
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  return new FFmpeg();
};
```

---

## 4. メディア処理の問題

### 4.1 致命的: GIFファイル (179MB)

**ディレクトリ**: `application/public/movies/`

| ファイル数 | 合計サイズ | 平均サイズ | 最大 |
|-----------|-----------|-----------|------|
| 15 | 179MB | 12MB | 25MB |

**修正**: GIF → WebM変換

```bash
# FFmpegでWebM変換
ffmpeg -i input.gif -c:v libvpx-vp9 -crf 30 -b:v 0 output.webm

# 期待される削減: 179MB → 18MB (90%削減)
```

**コンポーネント修正**: `PausableMovie.tsx`

```tsx
// 現在: GIF + Canvas描画
import gifler from "gifler";
const decoder = omggif.GifReader(new Uint8Array(buffer));

// 修正後: <video>要素
<video
  src={movieUrl}
  autoPlay={!prefersReducedMotion}
  loop
  muted
  playsInline
  onClick={() => videoRef.current?.paused ? play() : pause()}
/>
```

### 4.2 致命的: 画像最適化なし (89MB)

**ディレクトリ**: `application/public/images/`

| 形式 | ファイル数 | 合計サイズ | 問題 |
|-----|-----------|-----------|------|
| JPG | 31 | 89MB | WebP/AVIF未対応 |
| プロフィール | 30 | 3.2MB | 最適化なし |

**修正方法**:

1. **WebP変換**
```bash
# Sharp.jsで変換
sharp input.jpg.webp({ quality: 80 }).toFile("output.webp")
# 期待削減: 30-40%
```

2. **レスポンシブ画像**
```tsx
<picture>
  <source srcSet="/images/photo.avif" type="image/avif" />
  <source srcSet="/images/photo.webp" type="image/webp" />
  <img src="/images/photo.jpg" loading="lazy" />
</picture>
```

3. **遅延読み込み**
```tsx
// 現在: 即時読み込み
<CoveredImage src={url} />

// 修正後: IntersectionObserver
<img src={url} loading="lazy" />
```

### 4.3 高: 音声ファイル (66MB)

**ディレクトリ**: `application/public/sounds/`

| ファイル数 | 合計サイズ | 平均サイズ |
|-----------|-----------|-----------|
| 15 | 66MB | 4.4MB |

**修正**:
- ビットレート最適化 (128kbps → 96kbps)
- OGG Vorbis形式への変換検討

---

## 5. CSS・フォントの問題

### 5.1 致命的: フォントサイズ (12.6MB)

**ディレクトリ**: `application/public/fonts/`

| フォント | サイズ | 形式 | 問題 |
|---------|--------|------|------|
| ReiNoAreMincho-Regular | 6.3MB | OTF | 未サブセット |
| ReiNoAreMincho-Heavy | 6.3MB | OTF | 未サブセット |

**修正方法**:

1. **WOFF2形式に変換** (40-50%削減)
```bash
# woff2_compress
woff2_compress ReiNoAreMincho-Regular.otf
```

2. **サブセット化** (使用文字のみ)
```bash
# pyftsubset
pyftsubset ReiNoAreMincho-Regular.otf \
  --text-file=used-characters.txt \
  --flavor=woff2 \
  --output-file=ReiNoAreMincho-Regular.subset.woff2
```

3. **font-display: swap**
```css
/* 現在 */
@font-face {
  font-display: block;  /* ❌ 3秒ブロック */
}

/* 修正後 */
@font-face {
  font-display: swap;  /* ✅ フォールバック即表示 */
}
```

### 5.2 高: Tailwind CSS CDN

**ファイル**: `application/client/src/index.html`

```html
<!-- 現在: ランタイム処理 -->
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.2.1"></script>

<!-- 修正後: ビルド時処理 -->
<!-- CDN削除、PostCSSでビルド時に処理 -->
```

### 5.3 中: FontAwesome SVGスプライト

**ディレクトリ**: `application/public/sprites/font-awesome/`

| ファイル | サイズ |
|---------|--------|
| solid.svg | 640KB |
| brands.svg | 458KB |
| regular.svg | 107KB |
| **合計** | **1.2MB** |

**修正**: 使用アイコンのみをインライン化

---

## 6. Reactコンポーネントの問題

### 6.1 致命的: 無限スクロールのバグ

**ファイル**: `application/client/src/components/foundation/InfiniteScroll.tsx` (Lines 15-19)

```typescript
// 現在: 262,144回のループ (2^18)
const hasReached = Array.from(Array(2 ** 18), () => {
  return window.innerHeight + Math.ceil(window.scrollY) >= document.body.offsetHeight;
}).every(Boolean);

// 修正後: 1回の計算
const hasReached = window.innerHeight + Math.ceil(window.scrollY) >= document.body.offsetHeight;
```

### 6.2 致命的: コード分割なし

**ファイル**: `application/client/src/containers/AppContainer.tsx`

```typescript
// 現在: 全ルート即時インポート
import TimelineContainer from "./TimelineContainer";
import DirectMessageListContainer from "./DirectMessageListContainer";
// ...全てのコンテナ

// 修正後: React.lazy
const TimelineContainer = React.lazy(() => import("./TimelineContainer"));
const DirectMessageListContainer = React.lazy(() => import("./DirectMessageListContainer"));

// Routes内
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/" element={<TimelineContainer />} />
    {/* ... */}
  </Routes>
</Suspense>
```

### 6.3 高: メモ化なし

**対象ファイル**:
- `components/timeline/TimelineItem.tsx`
- `components/post/CommentItem.tsx`
- `components/post/ImageArea.tsx`

```typescript
// 修正: React.memo追加
export const TimelineItem = React.memo(function TimelineItem({ post }: Props) {
  // ...
});
```

### 6.4 高: 重いライブラリのグローバルインポート

**ファイル**: `components/new_post_modal/NewPostModalPage.tsx`

```typescript
// 現在: トップレベルインポート
import { convertImage } from "@/utils/convert_image";
import { convertMovie } from "@/utils/convert_movie";
import { convertSound } from "@/utils/convert_sound";

// 修正後: 動的インポート (使用時のみ)
const handleImageUpload = async (files: File[]) => {
  const { convertImage } = await import("@/utils/convert_image");
  // ...
};
```

---

## 7. サーバーサイドの問題

### 7.1 致命的: 圧縮なし

**ファイル**: `application/server/src/app.ts`

```typescript
// 修正: compression追加
import compression from "compression";
app.use(compression());
```

### 7.2 致命的: キャッシュ無効

**ファイル**: `application/server/src/app.ts` (Lines 16-22)

```typescript
// 現在
app.use((_req, res, next) => {
  res.header({
    "Cache-Control": "max-age=0, no-transform",  // ❌ キャッシュ無効
    Connection: "close",  // ❌ Keep-Alive無効
  });
  return next();
});

// 修正後
app.use((_req, res, next) => {
  // 静的ファイルは長期キャッシュ
  if (req.url.match(/\.(js|css|png|jpg|webp|woff2)$/)) {
    res.header("Cache-Control", "public, max-age=31536000, immutable");
  }
  return next();
});
```

### 7.3 高: 静的ファイルのETag無効

**ファイル**: `application/server/src/routes/static.ts`

```typescript
// 現在
serveStatic(UPLOAD_PATH, {
  etag: false,        // ❌
  lastModified: false // ❌
});

// 修正後
serveStatic(UPLOAD_PATH, {
  etag: true,
  lastModified: true,
  maxAge: "1y",
  immutable: true,
});
```

### 7.4 中: N+1クエリ問題

**ファイル**: `application/server/src/models/Post.ts`

```typescript
// 現在: 全関連を常にロード
defaultScope: {
  include: [
    { association: "user", include: [{ association: "profileImage" }] },
    { association: "images" },
    { association: "movie" },
    { association: "sound" },
  ],
}

// 修正後: 必要な時のみロード (スコープ分離)
Post.scope("withUser").findAll();
Post.scope("withMedia").findAll();
```

---

## 8. 改善優先度マトリックス

### P0: 致命的 (即座に対応)

| 項目 | 期待効果 | 工数 |
|-----|---------|------|
| Webpack最適化有効化 | 85%削減 | 低 |
| GIF→WebM変換 | 90%削減 | 中 |
| 無限スクロールバグ修正 | TBT改善 | 低 |
| gzip圧縮有効化 | 60-70%削減 | 低 |
| キャッシュヘッダー修正 | 再訪問高速化 | 低 |

### P1: 高優先度

| 項目 | 期待効果 | 工数 |
|-----|---------|------|
| jQuery/lodash/moment削除 | 224KB削減 | 中 |
| React.lazy導入 | 初期ロード50%削減 | 中 |
| フォントWOFF2+サブセット | 92%削減 | 中 |
| 画像WebP変換 | 30-40%削減 | 中 |

### P2: 中優先度

| 項目 | 期待効果 | 工数 |
|-----|---------|------|
| React.memo追加 | レンダリング改善 | 低 |
| WASM遅延読み込み | 初期ロード改善 | 中 |
| Tailwind CDN→ビルド | JS削減 | 中 |
| N+1クエリ修正 | API高速化 | 高 |

---

## 9. 具体的な修正手順

### Step 1: Webpack設定修正 (最優先)

```bash
# 1. webpack.config.js修正
# 2. package.jsonのbuildスクリプト修正
# 3. babel.config.js修正
```

### Step 2: サーバー圧縮・キャッシュ

```bash
pnpm add compression
# app.tsにcompression追加
# Cache-Controlヘッダー修正
```

### Step 3: 無限スクロールバグ修正

```bash
# InfiniteScroll.tsx の2^18ループを削除
```

### Step 4: メディア最適化

```bash
# GIF→WebM変換スクリプト作成
# 画像WebP変換
# フォントサブセット化
```

### Step 5: 依存関係削除

```bash
pnpm remove jquery bluebird moment lodash
# 各ファイルでネイティブAPI使用に置換
```

### Step 6: React最適化

```bash
# React.lazy導入
# React.memo追加
# 動的インポート実装
```

---

## 期待される最終スコア

| 項目 | Before | After (推定) |
|-----|--------|-------------|
| バンドルサイズ | 108MB | 5-10MB |
| 初期ロード時間 | 30秒+ | 3-5秒 |
| LCP | 0点 | 20-25点 |
| FCP | 0点 | 8-10点 |
| TBT | 0-23点 | 25-30点 |
| **合計スコア** | **288点** | **600-700点+** |

---

## 参考ファイル一覧

### 設定ファイル
- `application/client/webpack.config.js`
- `application/client/babel.config.js`
- `application/client/package.json`
- `application/server/src/app.ts`

### 主要コンポーネント
- `application/client/src/components/foundation/InfiniteScroll.tsx`
- `application/client/src/containers/AppContainer.tsx`
- `application/client/src/components/foundation/PausableMovie.tsx`
- `application/client/src/components/foundation/CoveredImage.tsx`

### ユーティリティ
- `application/client/src/utils/fetchers.ts`
- `application/client/src/utils/convert_image.ts`
- `application/client/src/utils/convert_movie.ts`
