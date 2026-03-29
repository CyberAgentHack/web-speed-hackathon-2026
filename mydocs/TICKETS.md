# Web Speed Hackathon 2026 改善チケット

## グループ概要

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        独立して並行作業可能                              │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────────┤
│  Group A    │  Group B    │  Group C    │  Group D    │    Group E      │
│  ビルド設定  │  サーバー   │  メディア   │   React     │  依存関係削除   │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────────┤
│ webpack     │ app.ts      │ public/     │ components/ │ utils/          │
│ babel       │ routes/     │ fonts/      │ containers/ │ package.json    │
│ postcss     │ models/     │ sprites/    │ hooks/      │ (dependencies)  │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────────┘
```

---

## Group A: ビルド設定最適化

**担当ファイル**:
- `application/client/webpack.config.js`
- `application/client/babel.config.js`
- `application/client/postcss.config.js`
- `application/client/package.json` (scripts部分のみ)

**他グループとの境界**: ビルド設定のみ。ソースコードは触らない。

---

### A-1: Webpack最適化フラグ有効化

**優先度**: P0 (致命的)
**期待効果**: バンドルサイズ 50-60% 削減
**工数**: 小

**現状**:
```javascript
// webpack.config.js (Lines 131-136)
optimization: {
  minimize: false,
  splitChunks: false,
  usedExports: false,
  providedExports: false,
  sideEffects: false,
  concatenateModules: false,
}
```

**修正内容**:
```javascript
optimization: {
  minimize: true,
  splitChunks: {
    chunks: "all",
    maxInitialRequests: 25,
    minSize: 20000,
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name(module) {
          const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
          return `vendor.${packageName.replace('@', '')}`;
        },
        priority: 10,
      },
      common: {
        minChunks: 2,
        priority: 5,
        reuseExistingChunk: true,
      },
    },
  },
  usedExports: true,
  providedExports: true,
  sideEffects: true,
  concatenateModules: true,
}
```

**対象ファイル**:
- `application/client/webpack.config.js`

---

### A-2: ビルドモードをproductionに変更

**優先度**: P0 (致命的)
**期待効果**: Webpackデフォルト最適化適用
**工数**: 小

**現状**:
```javascript
// webpack.config.js (Line 39)
mode: "none",

// package.json (Line 8)
"build": "NODE_ENV=development webpack"
```

**修正内容**:
```javascript
// webpack.config.js
mode: "production",

// package.json
"build": "NODE_ENV=production webpack"
```

**対象ファイル**:
- `application/client/webpack.config.js`
- `application/client/package.json`

---

### A-3: ソースマップを外部化または無効化

**優先度**: P1 (高)
**期待効果**: バンドルサイズ 10-15MB 削減
**工数**: 小

**現状**:
```javascript
// webpack.config.js (Line 28)
devtool: "inline-source-map",
```

**修正内容**:
```javascript
devtool: false,  // 本番ではソースマップ不要
// または
devtool: "source-map",  // 外部ファイルとして生成
```

**対象ファイル**:
- `application/client/webpack.config.js`

---

### A-4: Babel設定最適化 (IE11サポート削除、core-js最適化)

**優先度**: P1 (高)
**期待効果**: 15MB削減 (core-js全体 → 必要分のみ)
**工数**: 小

**現状**:
```javascript
// babel.config.js
["@babel/preset-env", {
  targets: "ie 11",  // IE11サポート
}]

// webpack.config.js (Lines 31-32)
entry: {
  main: ["core-js", "regenerator-runtime/runtime", ...]
}
```

**修正内容**:
```javascript
// babel.config.js
["@babel/preset-env", {
  targets: "> 0.5%, last 2 versions, not dead, not ie 11",
  useBuiltIns: "usage",
  corejs: 3,
}]

// webpack.config.js - entryからcore-js削除
entry: {
  main: ["./src/index.tsx"]
}
```

**対象ファイル**:
- `application/client/babel.config.js`
- `application/client/webpack.config.js`

---

### A-5: React開発モードを本番モードに変更

**優先度**: P1 (高)
**期待効果**: React DevToolsヘルパー削除
**工数**: 小

**現状**:
```javascript
// babel.config.js (Line 16)
["@babel/preset-react", {
  development: true,
  runtime: "automatic",
}]
```

**修正内容**:
```javascript
["@babel/preset-react", {
  development: false,
  runtime: "automatic",
}]
```

**対象ファイル**:
- `application/client/babel.config.js`

---

## Group B: サーバーサイド最適化

**担当ファイル**:
- `application/server/src/app.ts`
- `application/server/src/routes/static.ts`
- `application/server/src/routes/api/*.ts`
- `application/server/src/models/*.ts`
- `application/server/package.json` (compression追加)

**他グループとの境界**: サーバーコードのみ。クライアントは触らない。

---

### B-1: gzip/brotli圧縮の有効化

**優先度**: P0 (致命的)
**期待効果**: 転送サイズ 60-70% 削減
**工数**: 小

**現状**: 圧縮ミドルウェアなし

**修正内容**:
```typescript
// app.ts
import compression from "compression";

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));
```

**対象ファイル**:
- `application/server/src/app.ts`
- `application/server/package.json` (compression追加)

---

### B-2: Cache-Controlヘッダー修正

**優先度**: P0 (致命的)
**期待効果**: 再訪問時のロード大幅改善
**工数**: 小

**現状**:
```typescript
// app.ts (Lines 16-22)
app.use((_req, res, next) => {
  res.header({
    "Cache-Control": "max-age=0, no-transform",
    Connection: "close",
  });
  return next();
});
```

**修正内容**:
```typescript
// 静的ファイルは長期キャッシュ
app.use((req, res, next) => {
  if (req.path.match(/\.(js|css|woff2|webp|avif|mp4|webm)$/)) {
    res.header("Cache-Control", "public, max-age=31536000, immutable");
  } else if (req.path.match(/\.(jpg|png|gif|svg)$/)) {
    res.header("Cache-Control", "public, max-age=86400");
  }
  // Connection: close を削除 (Keep-Alive有効化)
  return next();
});
```

**対象ファイル**:
- `application/server/src/app.ts`

---

### B-3: 静的ファイルのETag有効化

**優先度**: P1 (高)
**期待効果**: 304レスポンスによる帯域節約
**工数**: 小

**現状**:
```typescript
// static.ts
serveStatic(UPLOAD_PATH, {
  etag: false,
  lastModified: false,
});
```

**修正内容**:
```typescript
serveStatic(UPLOAD_PATH, {
  etag: true,
  lastModified: true,
  maxAge: "1d",
});

serveStatic(PUBLIC_PATH, {
  etag: true,
  lastModified: true,
  maxAge: "1y",
  immutable: true,
});
```

**対象ファイル**:
- `application/server/src/routes/static.ts`

---

### B-4: Sequelizeデフォルトスコープの最適化

**優先度**: P2 (中)
**期待効果**: API応答時間改善
**工数**: 中

**現状**:
```typescript
// Post.ts - 常に全関連をロード
defaultScope: {
  include: [
    { association: "user", include: [{ association: "profileImage" }] },
    { association: "images" },
    { association: "movie" },
    { association: "sound" },
  ],
}
```

**修正内容**:
```typescript
// スコープを分離
scopes: {
  withUser: { include: [{ association: "user" }] },
  withMedia: { include: [{ association: "images" }, { association: "movie" }, { association: "sound" }] },
  full: { include: [...] },
}
// デフォルトスコープは最小限に
defaultScope: {}
```

**対象ファイル**:
- `application/server/src/models/Post.ts`
- `application/server/src/models/Comment.ts`
- `application/server/src/routes/api/*.ts` (スコープ指定追加)

---

### B-5: 検索APIの最適化

**優先度**: P2 (中)
**期待効果**: 検索レスポンス時間改善
**工数**: 中

**現状**: 2つのクエリ + メモリ内マージ + 全件取得後にスライス

**修正内容**:
- UNIONクエリで1回に統合
- LIMIT/OFFSETをDB側で処理
- インデックス追加

**対象ファイル**:
- `application/server/src/routes/api/search.ts`

---

## Group C: メディア最適化

**担当ファイル**:
- `application/public/movies/*.gif` → WebM変換
- `application/public/images/*.jpg` → WebP変換
- `application/public/fonts/*.otf` → WOFF2変換/サブセット
- `application/public/sprites/font-awesome/*.svg` → 最適化

**他グループとの境界**: 静的アセットのみ。コードは触らない（Group Dと連携が必要な場合は明記）。

---

### C-1: GIFファイルをWebM/MP4に変換

**優先度**: P0 (致命的)
**期待効果**: 179MB → 18MB (90%削減)
**工数**: 中

**現状**: 15個のGIFファイル (合計179MB)

**修正内容**:
```bash
# 変換スクリプト
for gif in public/movies/*.gif; do
  ffmpeg -i "$gif" \
    -c:v libvpx-vp9 -crf 30 -b:v 0 \
    -an \
    "${gif%.gif}.webm"

  ffmpeg -i "$gif" \
    -c:v libx264 -crf 23 \
    -movflags +faststart \
    "${gif%.gif}.mp4"
done
```

**対象ファイル**:
- `application/public/movies/*.gif` → `.webm` + `.mp4`

**注意**: Group D の C-1連携チケット (D-6) でコンポーネント修正が必要

---

### C-2: 画像をWebP形式に変換

**優先度**: P1 (高)
**期待効果**: 89MB → 55MB (35%削減)
**工数**: 中

**現状**: 31個のJPGファイル (合計89MB)

**修正内容**:
```bash
# Sharp.jsで変換
for jpg in public/images/*.jpg; do
  npx sharp-cli "$jpg" -o "${jpg%.jpg}.webp" --quality 80
done
```

**対象ファイル**:
- `application/public/images/*.jpg` → `.webp` 追加

---

### C-3: プロフィール画像の最適化

**優先度**: P1 (高)
**期待効果**: 3.2MB → 600KB (80%削減)
**工数**: 小

**現状**: 30個のプロフィール画像 (平均107KB)

**修正内容**:
- 150x150pxにリサイズ
- WebP形式で品質75
- 目標: 1ファイル20KB以下

**対象ファイル**:
- `application/public/images/profiles/*.jpg`

---

### C-4: フォントをWOFF2形式に変換

**優先度**: P1 (高)
**期待効果**: 12.6MB → 5MB (60%削減)
**工数**: 小

**現状**: 2個のOTFファイル (各6.3MB)

**修正内容**:
```bash
# woff2変換
woff2_compress public/fonts/ReiNoAreMincho-Regular.otf
woff2_compress public/fonts/ReiNoAreMincho-Heavy.otf
```

**対象ファイル**:
- `application/public/fonts/ReiNoAreMincho-Regular.otf` → `.woff2`
- `application/public/fonts/ReiNoAreMincho-Heavy.otf` → `.woff2`
- `application/client/src/index.css` (フォーマット指定変更)

---

### C-5: フォントのサブセット化

**優先度**: P1 (高)
**期待効果**: 5MB → 500KB (90%削減)
**工数**: 中

**現状**: 全Unicode範囲を含む

**修正内容**:
```bash
# 使用文字のみ抽出
pyftsubset ReiNoAreMincho-Regular.woff2 \
  --text-file=used-characters.txt \
  --flavor=woff2 \
  --output-file=ReiNoAreMincho-Regular.subset.woff2
```

**対象ファイル**:
- `application/public/fonts/*.woff2`

---

### C-6: FontAwesome SVGスプライトの最適化

**優先度**: P2 (中)
**期待効果**: 1.2MB → 100KB (90%削減)
**工数**: 中

**現状**: 3個のSVGスプライト (合計1.2MB)

**修正内容**:
- 使用アイコンのみ抽出
- 未使用アイコン削除
- SVGO最適化

**対象ファイル**:
- `application/public/sprites/font-awesome/*.svg`

---

## Group D: Reactコンポーネント最適化

**担当ファイル**:
- `application/client/src/components/**/*.tsx`
- `application/client/src/containers/**/*.tsx`
- `application/client/src/hooks/**/*.ts`
- `application/client/src/index.tsx`
- `application/client/src/index.html`

**他グループとの境界**: Reactコード最適化のみ。ビルド設定やサーバーは触らない。

---

### D-1: 無限スクロールのバグ修正

**優先度**: P0 (致命的)
**期待効果**: TBT大幅改善、CPU使用率削減
**工数**: 小

**現状**:
```typescript
// InfiniteScroll.tsx (Lines 15-19)
const hasReached = Array.from(Array(2 ** 18), () => {
  return window.innerHeight + Math.ceil(window.scrollY) >= document.body.offsetHeight;
}).every(Boolean);
```

**修正内容**:
```typescript
const hasReached = window.innerHeight + Math.ceil(window.scrollY) >= document.body.offsetHeight;
```

**対象ファイル**:
- `application/client/src/components/foundation/InfiniteScroll.tsx`

---

### D-2: ルートベースのコード分割 (React.lazy)

**優先度**: P0 (致命的)
**期待効果**: 初期ロード 50-70% 削減
**工数**: 中

**現状**:
```typescript
// AppContainer.tsx - 即時インポート
import TimelineContainer from "./TimelineContainer";
import DirectMessageListContainer from "./DirectMessageListContainer";
// ...全コンテナ
```

**修正内容**:
```typescript
import { lazy, Suspense } from "react";

const TimelineContainer = lazy(() => import("./TimelineContainer"));
const DirectMessageListContainer = lazy(() => import("./DirectMessageListContainer"));
const SearchContainer = lazy(() => import("./SearchContainer"));
const UserProfileContainer = lazy(() => import("./UserProfileContainer"));
const PostContainer = lazy(() => import("./PostContainer"));
const TermContainer = lazy(() => import("./TermContainer"));
const CrokContainer = lazy(() => import("./CrokContainer"));

// Routes内
<Suspense fallback={<div>Loading...</div>}>
  <Routes>
    <Route path="/" element={<TimelineContainer />} />
    {/* ... */}
  </Routes>
</Suspense>
```

**対象ファイル**:
- `application/client/src/containers/AppContainer.tsx`

---

### D-3: 重いライブラリの動的インポート

**優先度**: P1 (高)
**期待効果**: 初期バンドルから50MB以上削減
**工数**: 中

**現状**: FFmpeg, ImageMagick, web-llm がトップレベルインポート

**修正内容**:
```typescript
// NewPostModalPage.tsx
const handleImageUpload = async (files: File[]) => {
  const { convertImage } = await import("@/utils/convert_image");
  // ...
};

// TranslatableText.tsx
const handleTranslate = async () => {
  const { createTranslator } = await import("@/utils/create_translator");
  // ...
};
```

**対象ファイル**:
- `application/client/src/components/new_post_modal/NewPostModalPage.tsx`
- `application/client/src/components/post/TranslatableText.tsx`
- `application/client/src/utils/load_ffmpeg.ts`
- `application/client/src/utils/convert_image.ts`

---

### D-4: React.memo によるコンポーネントメモ化

**優先度**: P1 (高)
**期待効果**: 不要な再レンダリング削減
**工数**: 小

**現状**: メモ化なし

**修正内容**:
```typescript
// TimelineItem.tsx
export const TimelineItem = React.memo(function TimelineItem({ post }: Props) {
  // ...
});

// CommentItem.tsx
export const CommentItem = React.memo(function CommentItem({ comment }: Props) {
  // ...
});
```

**対象ファイル**:
- `application/client/src/components/timeline/TimelineItem.tsx`
- `application/client/src/components/post/CommentItem.tsx`
- `application/client/src/components/post/ImageArea.tsx`
- `application/client/src/components/post/MovieArea.tsx`
- `application/client/src/components/post/SoundArea.tsx`
- `application/client/src/components/crok/ChatMessage.tsx`

---

### D-5: 画像の遅延読み込み (loading="lazy")

**優先度**: P1 (高)
**期待効果**: 初期ロード時間改善
**工数**: 小

**現状**: 全画像が即時読み込み

**修正内容**:
```typescript
// CoveredImage.tsx
<img src={blobUrl} loading="lazy" decoding="async" />
```

**対象ファイル**:
- `application/client/src/components/foundation/CoveredImage.tsx`

---

### D-6: PausableMovieをvideo要素に変更 (C-1連携)

**優先度**: P1 (高)
**期待効果**: GIF Canvas描画の廃止
**工数**: 中

**前提**: Group C の C-1 (GIF→WebM変換) 完了後

**現状**:
```typescript
// Canvas + gifler でGIF描画
import gifler from "gifler";
```

**修正内容**:
```typescript
<video
  ref={videoRef}
  autoPlay={!prefersReducedMotion}
  loop
  muted
  playsInline
  onClick={handleClick}
>
  <source src={movieUrl.replace('.gif', '.webm')} type="video/webm" />
  <source src={movieUrl.replace('.gif', '.mp4')} type="video/mp4" />
</video>
```

**対象ファイル**:
- `application/client/src/components/foundation/PausableMovie.tsx`

---

### D-7: SoundWaveSVGの計算メモ化

**優先度**: P2 (中)
**期待効果**: 音声ページの再レンダリング改善
**工数**: 小

**現状**: 毎レンダリングで音声波形再計算

**修正内容**:
```typescript
const peaks = useMemo(() => {
  // 波形計算ロジック
}, [buffer]);
```

**対象ファイル**:
- `application/client/src/components/foundation/SoundWaveSVG.tsx`

---

### D-8: Tailwind CDNを削除

**優先度**: P2 (中)
**期待効果**: ランタイムCSS処理の削除
**工数**: 中

**現状**:
```html
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.2.1"></script>
```

**修正内容**:
- Tailwind CLIでビルド時にCSS生成
- CDNスクリプト削除

**対象ファイル**:
- `application/client/src/index.html`
- `application/client/postcss.config.js`
- `application/client/tailwind.config.js` (新規作成)

---

### D-9: font-display: swap に変更

**優先度**: P1 (高)
**期待効果**: FCP改善
**工数**: 小

**現状**:
```css
@font-face {
  font-display: block;
}
```

**修正内容**:
```css
@font-face {
  font-display: swap;
}
```

**対象ファイル**:
- `application/client/src/index.css`

---

## Group E: 依存関係削除・軽量化

**担当ファイル**:
- `application/client/src/utils/*.ts`
- `application/client/package.json` (dependencies部分)

**他グループとの境界**: utilsとpackage.json依存関係のみ。コンポーネントは触らない。

---

### E-1: jQuery削除 → fetch API

**優先度**: P0 (致命的)
**期待効果**: 85KB削減
**工数**: 小

**現状**:
```typescript
// fetchers.ts
import $ from "jquery";
$.ajax({ async: false, ... })
```

**修正内容**:
```typescript
export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  return response.arrayBuffer();
}

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  return response.json();
}
```

**対象ファイル**:
- `application/client/src/utils/fetchers.ts`
- `application/client/package.json` (jquery削除)
- `application/client/webpack.config.js` (ProvidePlugin削除)

---

### E-2: lodash削除 → ネイティブJS

**優先度**: P1 (高)
**期待効果**: 72KB削減
**工数**: 小

**現状**:
```typescript
import _ from "lodash";
_.map(), _.zip(), _.chunk(), _.mean(), _.max()
```

**修正内容**:
```typescript
// SoundWaveSVG.tsx用のユーティリティ
function chunk<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
}

function mean(array: number[]): number {
  return array.reduce((a, b) => a + b, 0) / array.length;
}
```

**対象ファイル**:
- `application/client/src/components/foundation/SoundWaveSVG.tsx`
- `application/client/src/utils/bm25_search.ts`
- `application/client/package.json` (lodash削除)

---

### E-3: moment削除 → Intl API

**優先度**: P1 (高)
**期待効果**: 67KB削減
**工数**: 中

**現状**:
```typescript
import moment from "moment";
moment(date).locale("ja").format("LL")
```

**修正内容**:
```typescript
// utils/date.ts (新規)
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatRelative(date: string | Date): string {
  const rtf = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "今日";
  if (days < 7) return rtf.format(-days, "day");
  return formatDate(date);
}
```

**対象ファイル**:
- `application/client/src/utils/date.ts` (新規作成)
- `application/client/src/components/user_profile/UserProfileHeader.tsx`
- `application/client/src/components/post/CommentItem.tsx`
- `application/client/src/components/post/PostItem.tsx`
- `application/client/src/components/timeline/TimelineItem.tsx`
- `application/client/src/components/direct_message/DirectMessagePage.tsx`
- `application/client/src/components/direct_message/DirectMessageListPage.tsx`
- `application/client/package.json` (moment削除)

---

### E-4: Bluebird削除 → ネイティブPromise

**優先度**: P2 (中)
**期待効果**: 20KB削減
**工数**: 小

**現状**:
```typescript
import Bluebird from "bluebird";
const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath: "/dicts" }));
```

**修正内容**:
```typescript
function buildTokenizer(): Promise<Tokenizer> {
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: "/dicts" }).build((err, tokenizer) => {
      if (err) reject(err);
      else resolve(tokenizer);
    });
  });
}
```

**対象ファイル**:
- `application/client/src/utils/negaposi_analyzer.ts`
- `application/client/src/components/crok/ChatInput.tsx`
- `application/client/package.json` (bluebird削除)

---

## グループ間依存関係マップ

```
Group A (ビルド設定)
    │
    └── 独立 (他グループに影響なし)

Group B (サーバー)
    │
    └── 独立 (他グループに影響なし)

Group C (メディア)
    │
    └──→ Group D (D-6: PausableMovie修正)
         ※ C-1完了後にD-6を実施

Group D (React)
    │
    ├── D-6 は C-1 に依存
    │
    └── E-3 完了後に該当コンポーネント修正
         ※ E-3で作成したdate.tsを使用

Group E (依存関係)
    │
    └── E-3 の後、コンポーネント側のimport修正が必要
         → Group D担当者と連携
```

---

## 実行順序推奨

### Phase 1: 独立して並行作業可能

| グループ | チケット | 担当者 |
|---------|---------|--------|
| A | A-1, A-2, A-3, A-4, A-5 | 担当者A |
| B | B-1, B-2, B-3 | 担当者B |
| C | C-2, C-3, C-4, C-5, C-6 | 担当者C |
| D | D-1, D-2, D-4, D-5, D-7, D-8, D-9 | 担当者D |
| E | E-1, E-2, E-4 | 担当者E |

### Phase 2: 依存関係あり

| チケット | 依存先 | 作業内容 |
|---------|--------|---------|
| C-1 | なし | GIF→WebM変換 |
| D-6 | C-1完了 | PausableMovie修正 |
| E-3 | なし | moment削除 + date.ts作成 |
| D (各) | E-3完了 | コンポーネントのimport修正 |

### Phase 3: 統合・検証

| チケット | 内容 |
|---------|------|
| B-4, B-5 | サーバー最適化 (Phase 1, 2完了後) |

---

## チケット一覧サマリー

| ID | タイトル | 優先度 | 工数 | グループ |
|----|---------|--------|------|---------|
| A-1 | Webpack最適化フラグ有効化 | P0 | 小 | A |
| A-2 | ビルドモードをproductionに | P0 | 小 | A |
| A-3 | ソースマップ外部化/無効化 | P1 | 小 | A |
| A-4 | Babel設定最適化 | P1 | 小 | A |
| A-5 | React本番モード | P1 | 小 | A |
| B-1 | gzip圧縮有効化 | P0 | 小 | B |
| B-2 | Cache-Control修正 | P0 | 小 | B |
| B-3 | ETag有効化 | P1 | 小 | B |
| B-4 | Sequelizeスコープ最適化 | P2 | 中 | B |
| B-5 | 検索API最適化 | P2 | 中 | B |
| C-1 | GIF→WebM変換 | P0 | 中 | C |
| C-2 | 画像WebP変換 | P1 | 中 | C |
| C-3 | プロフィール画像最適化 | P1 | 小 | C |
| C-4 | フォントWOFF2変換 | P1 | 小 | C |
| C-5 | フォントサブセット化 | P1 | 中 | C |
| C-6 | SVGスプライト最適化 | P2 | 中 | C |
| D-1 | 無限スクロールバグ修正 | P0 | 小 | D |
| D-2 | React.lazy導入 | P0 | 中 | D |
| D-3 | 動的インポート | P1 | 中 | D |
| D-4 | React.memo追加 | P1 | 小 | D |
| D-5 | 画像遅延読み込み | P1 | 小 | D |
| D-6 | PausableMovie修正 | P1 | 中 | D |
| D-7 | SoundWaveSVGメモ化 | P2 | 小 | D |
| D-8 | Tailwind CDN削除 | P2 | 中 | D |
| D-9 | font-display: swap | P1 | 小 | D |
| E-1 | jQuery削除 | P0 | 小 | E |
| E-2 | lodash削除 | P1 | 小 | E |
| E-3 | moment削除 | P1 | 中 | E |
| E-4 | Bluebird削除 | P2 | 小 | E |

**合計: 28チケット**
- P0 (致命的): 8チケット
- P1 (高): 14チケット
- P2 (中): 6チケット
