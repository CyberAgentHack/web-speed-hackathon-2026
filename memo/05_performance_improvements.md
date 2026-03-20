# パフォーマンス改善計画 (優先度順)

## 採点指標の配点 (重要度の参考)
- TBT (Total Blocking Time): 30点/ページ → 最重要
- LCP (Largest Contentful Paint): 25点/ページ
- CLS (Cumulative Layout Shift): 25点/ページ
- FCP (First Contentful Paint): 10点/ページ
- SI (Speed Index): 10点/ページ

## P0: 即効性の高い改善 (バンドル・ネットワーク)

### 1. Webpack最適化有効化
- **ファイル**: `client/webpack.config.js`
- **内容**:
  - mode: "production"
  - minimize: true (terser)
  - splitChunks 有効化 (コード分割)
  - usedExports: true (Tree Shaking)
  - concatenateModules: true
  - cache: true
  - devtool: "source-map" or false (inline除去)
- **効果**: バンドルサイズ 60-70% 削減、TBT大幅改善

### 2. 同期AJAX廃止
- **ファイル**: `client/src/utils/fetchers.ts`
- **内容**: jQuery async:false → fetch API (async/await)
- **効果**: TBT大幅改善 (メインスレッドブロック解消)

### 3. Babel target変更
- **ファイル**: `client/babel.config.js`
- **内容**: targets "ie 11" → 最新Chrome / browserslist
- **内容**: modules: "commonjs" → false (ESM, Tree Shaking有効化)
- **効果**: ポリフィル削減、バンドル縮小

### 4. フォント最適化
- **ファイル**: `client/src/index.css`, フォントファイル
- **内容**:
  - OTF → WOFF2 変換 (サブセット化)
  - font-display: block → swap
  - 利用規約ページでのみ読み込み
- **効果**: FCP/LCP改善 (13MB → 数百KB)

### 5. Tailwind CSS ビルド時処理
- **ファイル**: `client/src/index.html`, webpack設定
- **内容**: CDNブラウザJIT → ビルド時にCSS生成
- **効果**: FCP改善、CSSパース不要に

## P1: メディア最適化

### 6. 画像最適化
- **内容**:
  - JPG → WebP/AVIF 変換
  - レスポンシブ画像 (srcset)
  - 遅延読み込み (loading="lazy")
  - 適切なサイズにリサイズ
- **効果**: 画像転送量 70-90% 削減、LCP改善

### 7. 動画最適化
- **内容**:
  - GIF → MP4/WebM 変換
  - <video> タグで再生
  - 遅延読み込み
- **効果**: 動画転送量 85% 削減 (180MB → ~20MB)

### 8. 音声最適化
- **内容**:
  - MP3のビットレート/サンプリングレート最適化
  - ストリーミング再生
- **効果**: 音声転送量削減

## P2: コード最適化

### 9. レガシーライブラリ置換
- jQuery → fetch API
- moment → dayjs or date-fns
- lodash → 個別import or ネイティブ
- bluebird → ネイティブPromise
- redux-form → React Hook Form or ネイティブ
- **効果**: ~1MB バンドル削減

### 10. 無限スクロール修正
- **ファイル**: `client/src/components/foundation/InfiniteScroll.tsx`
- **内容**: 2^18ループ → IntersectionObserver
- **効果**: scroll時のCPU負荷99.9%削減

### 11. コンポーネント最適化
- React.lazy + Suspense (ルート単位コード分割)
- React.memo 適用
- 不要な再レンダリング防止

## P3: サーバー最適化

### 12. HTTPキャッシュ有効化
- **ファイル**: `server/src/app.ts`, `server/src/routes/static.ts`
- **内容**:
  - 静的ファイル: Cache-Control: max-age=31536000 (ハッシュ付き)
  - API: 適切なETag/Last-Modified
- **効果**: リピート訪問の高速化

### 13. DB最適化
- defaultScope の include 最小化
- 検索クエリ最適化 (インデックス追加)
- 起動時のSQLiteコピー回避

### 14. 圧縮
- gzip/brotli 圧縮 (expressミドルウェア)
- **効果**: テキストアセット 60-80% 削減

## 改善の着手順序 (推奨)
1. Webpack最適化 (#1) + Babel target (#3) → 最大効果
2. 同期AJAX廃止 (#2) → TBT即改善
3. フォント最適化 (#4) + Tailwind (#5) → FCP改善
4. 画像/動画最適化 (#6, #7) → LCP改善
5. レガシーライブラリ (#9) + 無限スクロール (#10) → バンドル縮小
6. サーバー最適化 (#12, #13, #14) → 全体的な改善
