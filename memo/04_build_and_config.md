# ビルド・設定調査

## ビルドフロー
```
pnpm run build  → client の webpack ビルドのみ
pnpm run start  → server の tsx 直接実行 (ビルド不要)
```

## Webpack設定 (client/webpack.config.js)

### エントリー
```js
entry: {
  main: [
    "core-js",
    "regenerator-runtime/runtime",
    "jquery-binarytransport",
    "./src/index.css",
    "./src/buildinfo.ts",
    "./src/index.tsx"
  ]
}
```

### 出力
```js
output: {
  path: "./dist/",
  filename: "scripts/[name].js",        // 単一ファイル
  chunkFilename: "scripts/chunk-[contenthash].js",
  clean: true
}
```

### 最適化 (すべて無効)
```js
optimization: {
  minimize: false,
  splitChunks: false,
  concatenateModules: false,
  usedExports: false,
  providedExports: false,
  sideEffects: false,
}
cache: false
devtool: "inline-source-map"
mode: "none"
```

### ローダー
- babel-loader (jsx/tsx) → target: IE 11, modules: commonjs
- css-loader → postcss-loader → MiniCssExtractPlugin
- asset/bytes (バイナリリソース用)

### プラグイン
- ProvidePlugin: jQuery, AudioContext, Buffer
- EnvironmentPlugin: BUILD_DATE, COMMIT_HASH, NODE_ENV
- MiniCssExtractPlugin
- CopyWebpackPlugin: KaTeXフォント
- HtmlWebpackPlugin

## Babel設定 (client/babel.config.js)
```js
presets: [
  "@babel/preset-typescript",
  ["@babel/preset-env", { targets: "ie 11", corejs: "3", modules: "commonjs" }],
  ["@babel/preset-react", { development: true, runtime: "automatic" }]
]
```

## Dockerfile (マルチステージ)
```
Stage 1 (base): node:24.14.0-slim + pnpm
Stage 2 (build): pnpm install → pnpm build (NODE_OPTIONS="--max-old-space-size=4096") → pnpm install --prod
Stage 3 (runtime): /app コピー → PORT 8080 → pnpm start
```

## fly.toml (変更禁止)
- app: web-speed-hackathon-2026
- region: nrt (東京)
- NODE_ENV: production
- VM: shared CPU x1, 2048MB RAM
- internal_port: 8080

## 静的ファイル配信 (server/src/routes/static.ts)
- /public/ → serve-static (ETag: false, lastModified: false)
- /upload/ → serve-static
- /dist/ → serve-static
- connect-history-api-fallback (SPA対応)

## E2Eテスト (e2e/)
- Playwright 1.50.1
- Desktop Chrome
- timeout: 300秒
- globalSetup: POST /api/v1/initialize
- VRT: スクリーンショット比較

## Scoring Tool
- Lighthouse 12.8.2 + Playwright + Puppeteer Core
- 9ページ表示 + 5シナリオ操作の計測
- citty でCLI定義
