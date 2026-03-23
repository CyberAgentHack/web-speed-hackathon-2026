# CaX パフォーマンス改善計画

## 現状分析

### Lighthouse 結果（初期状態）

| カテゴリ | スコア |
|---------|--------|
| Performance | null (NO_FCP) |
| Accessibility | null (NO_FCP) |
| Best Practices | null (NO_FCP) |
| SEO | null (NO_FCP) |

全監査が `NO_FCP` エラー。ページが30秒以内に何もペイントできず、Lighthouse がタイムアウトしている。
つまり現状は **0点 / 1150点満点**。

### 採点基準（docs/scoring.md）

- ページの表示: 9ページ × 100点 = 900点満点
  - FCP×10 + SI×10 + LCP×25 + TBT×30 + CLS×25
- ページの操作: 5シナリオ × 50点 = 250点満点（表示300点以上で初めて採点）
  - TBT×25 + INP×25
- 合計: 1150点満点

---

## 発見されたボトルネック

### 🔴 P0: 致命的（ページが表示されない原因）

#### 1. レンダーブロッキング JS（`<script>` に defer/async なし）

```html
<script src="/scripts/main.js"></script>
```

`<head>` 内に同期 `<script>` があり、巨大な JS バンドルのダウンロード・パース・実行が完了するまで HTML パースが停止する。これが NO_FCP の直接原因。

#### 2. React が `window.load` イベントまで描画しない

```ts
window.addEventListener("load", () => {
  createRoot(document.getElementById("app")!).render(...);
});
```

全リソース（画像・フォント・CSS・JS）のロード完了を待ってから React をマウントしている。`DOMContentLoaded` や即時実行に変更すべき。

#### 3. webpack mode: "none"、最適化すべて無効

```js
mode: "none",
optimization: {
  minimize: false,
  splitChunks: false,
  concatenateModules: false,
  usedExports: false,
  providedExports: false,
  sideEffects: false,
},
```

minify なし、コード分割なし、tree shaking なし。バンドルサイズが膨大になる。

#### 4. Babel ターゲットが IE 11 + CommonJS モジュール

```js
targets: "ie 11",
modules: "commonjs",
```

- IE 11 向けトランスパイルで不要なポリフィルが大量に含まれる
- `modules: "commonjs"` により webpack の tree shaking が無効化される

#### 5. エントリに巨大ポリフィル同期バンドル

```js
entry: {
  main: [
    "core-js",                    // 全ポリフィル
    "regenerator-runtime/runtime", // async/await ポリフィル
    "jquery-binarytransport",      // jQuery プラグイン
    ...
  ],
},
```

#### 6. inline-source-map

```js
devtool: "inline-source-map",
```

ソースマップがバンドル内にインライン化され、JS ファイルサイズが倍増する。

---

### 🟠 P1: 重大（FCP/LCP/TBT に大きく影響）

#### 7. Tailwind CSS ブラウザランタイム（CDN）

```html
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.2.1"></script>
```

ブラウザ上で Tailwind CSS をコンパイルする。レンダーブロッキングかつ重い処理。ビルド時に CSS を生成すべき。

#### 8. フォント: 12MB OTF、font-display: block

| ファイル | サイズ |
|---------|--------|
| ReiNoAreMincho-Regular.otf | 5.9MB |
| ReiNoAreMincho-Heavy.otf | 5.8MB |

- OTF 形式（woff2 に変換すれば 1/3〜1/5 に圧縮可能）
- `font-display: block` でフォントロード完了までテキストが非表示

#### 9. 巨大な依存ライブラリ（クライアント）

| ライブラリ | 用途 | 問題 |
|-----------|------|------|
| @ffmpeg/ffmpeg + @ffmpeg/core | 動画変換 | WASM 含め数MB、初期ロード不要 |
| @imagemagick/magick-wasm | 画像変換 | WASM 含め数MB、初期ロード不要 |
| @mlc-ai/web-llm | AI チャット | 巨大、Crok ページのみで必要 |
| kuromoji | 形態素解析 | 辞書16MB、検索ページのみで必要 |
| moment | 日時処理 | 330KB、dayjs (2KB) で代替可能 |
| lodash | ユーティリティ | 全体バンドル、個別 import で削減可能 |
| jquery + jquery-binarytransport | DOM操作 | React アプリでは不要 |
| core-js | ポリフィル | Chrome 最新のみ対応なら大部分不要 |
| standardized-audio-context | Web Audio | ProvidePlugin で全ページに注入 |

#### 10. ProvidePlugin でグローバル注入

```js
new webpack.ProvidePlugin({
  $: "jquery",
  AudioContext: ["standardized-audio-context", "AudioContext"],
  Buffer: ["buffer", "Buffer"],
  "window.jQuery": "jquery",
}),
```

使用していないファイルにも jQuery, Buffer, AudioContext が注入される。

#### 11. NODE_ENV: "development"

```js
NODE_ENV: "development",
```

React の開発モードビルドが含まれ、サイズ増加 + 実行時チェックでパフォーマンス低下。

---

### 🟡 P2: 中程度（アセット最適化）

#### 12. 画像: 90MB、全て JPG

| 項目 | 値 |
|------|-----|
| 合計サイズ | 90MB |
| ファイル数 | 60枚 + 30プロフィール |
| 最大ファイル | 6.8MB |
| フォーマット | 全て JPG |

WebP/AVIF に変換し、適切なサイズにリサイズすれば 1/10 以下に削減可能。

#### 13. 動画: 180MB、全て GIF

| 項目 | 値 |
|------|-----|
| 合計サイズ | 180MB |
| ファイル数 | 15本 |
| 最大ファイル | 26MB |
| フォーマット | 全て GIF |

mp4 (H.264) に変換すれば 1/20〜1/50 に削減可能。`<video>` タグで再生。

#### 14. 音声: 66MB MP3

15ファイル、最大8.5MB。ビットレート削減やページ表示時にはロードしない対策が必要。

#### 15. サーバーキャッシュ無効

```js
res.header({
  "Cache-Control": "max-age=0, no-transform",
  Connection: "close",
});
// serveStatic: etag: false, lastModified: false
```

静的アセットにキャッシュヘッダーがなく、毎回フルダウンロードが発生する。

---

### 🟢 P3: 改善推奨

#### 16. chunkFormat: false

```js
output: {
  chunkFormat: false,
},
```

動的 import によるコード分割が無効化されている。

#### 17. gzip/brotli 圧縮なし

Express サーバーに圧縮ミドルウェアがない。テキストベースのリソースを圧縮すべき。

#### 18. 画像の lazy loading なし

タイムライン上の画像が全て即座にロードされる。viewport 外の画像は `loading="lazy"` にすべき。

---

## 改善計画（優先順位順）

### Phase 1: ページを表示させる（NO_FCP 解消）— 目標: 300点突破

これが最優先。300点を超えないと操作スコアが採点されない。

| # | 施策 | 対象ファイル | 期待効果 |
|---|------|-------------|---------|
| 1-1 | `<script defer>` に変更 | index.html | FCP 即改善 |
| 1-2 | `window.load` → 即時実行に変更 | index.tsx | FCP 即改善 |
| 1-3 | webpack `mode: "production"` | webpack.config.js | バンドル大幅縮小 |
| 1-4 | `devtool: "source-map"` (外部ファイル) or 削除 | webpack.config.js | JS サイズ半減 |
| 1-5 | Babel targets を `"last 1 Chrome version"` に | babel.config.js | ポリフィル不要に |
| 1-6 | `modules: false` (ESM 維持) | babel.config.js | tree shaking 有効化 |
| 1-7 | optimization 有効化 (minimize, splitChunks, tree shaking) | webpack.config.js | バンドル大幅縮小 |
| 1-8 | `NODE_ENV: "production"` | webpack.config.js | React prod ビルド |
| 1-9 | entry から core-js, regenerator-runtime 削除 | webpack.config.js | 不要コード削除 |
| 1-10 | `font-display: swap` に変更 | index.css | テキスト即表示 |

### Phase 2: スコアを伸ばす（LCP/TBT/CLS 改善）— 目標: 600点

| # | 施策 | 対象ファイル | 期待効果 |
|---|------|-------------|---------|
| 2-1 | Tailwind CSS をビルド時生成に変更 | index.html, postcss.config.js | レンダーブロッキング解消 |
| 2-2 | フォントを woff2 に変換 | public/fonts/ | 12MB → 2-3MB |
| 2-3 | 画像を WebP に変換 + リサイズ | public/images/ | 90MB → 5-10MB |
| 2-4 | 動画を mp4 に変換 | public/movies/ | 180MB → 5-10MB |
| 2-5 | コード分割 (chunkFormat 有効化 + dynamic import) | webpack.config.js, 各コンポーネント | 初期 JS 大幅削減 |
| 2-6 | 重いライブラリを lazy import | 各 utils/ | ffmpeg, imagemagick, web-llm, kuromoji を遅延ロード |
| 2-7 | moment → dayjs 置換 | 全体 | 330KB → 2KB |
| 2-8 | lodash → 個別 import or native | 全体 | バンドル削減 |
| 2-9 | jQuery 依存除去 | webpack.config.js, ProvidePlugin | 不要コード削除 |
| 2-10 | 静的アセットに Cache-Control 設定 | server/src/app.ts, routes/static.ts | リピートアクセス高速化 |

### Phase 3: 高得点を狙う（操作スコア含む）— 目標: 900点以上

| # | 施策 | 期待効果 |
|---|------|---------|
| 3-1 | gzip/brotli 圧縮ミドルウェア追加 | 転送サイズ 60-80% 削減 |
| 3-2 | 画像 lazy loading + width/height 明示 | CLS 改善 |
| 3-3 | API レスポンスの最適化（不要フィールド削除） | TTFB 改善 |
| 3-4 | SSR or プリレンダリング検討 | FCP/LCP 大幅改善 |
| 3-5 | Service Worker によるキャッシュ戦略 | リピートアクセス高速化 |
| 3-6 | 音声ファイルのビットレート最適化 | 転送サイズ削減 |
| 3-7 | kuromoji 辞書のオンデマンドロード | 検索ページ以外の TBT 改善 |
| 3-8 | React.lazy + Suspense でルート分割 | 各ページの初期 JS 削減 |
| 3-9 | preload/prefetch ヒント追加 | クリティカルリソースの早期取得 |
| 3-10 | INP 最適化（イベントハンドラの最適化） | 操作スコア改善 |

---

## アセットサイズまとめ

| カテゴリ | 現状サイズ | 目標サイズ | 削減率 |
|---------|-----------|-----------|--------|
| フォント (OTF) | 12MB | 2MB (woff2) | -83% |
| 画像 (JPG) | 90MB | 5MB (WebP+リサイズ) | -94% |
| 動画 (GIF) | 180MB | 5MB (mp4) | -97% |
| 音声 (MP3) | 66MB | 30MB (ビットレート最適化) | -55% |
| 辞書 (kuromoji) | 16MB | 16MB (遅延ロード) | 初期ロード 0 |
| JS バンドル | 推定 10MB+ | 200KB (初期) | -98% |
| 合計 | 364MB+ | ~58MB | -84% |

---

## レギュレーション上の注意点

- VRT (Visual Regression Tests) を壊さないこと
- 手動テスト項目 (test_cases.md) をパスすること
- `GET /api/v1/crok{?prompt}` の SSE プロトコルは変更不可
- `POST /api/v1/initialize` でDB初期化が動作すること
- fly.toml は変更不可

---

## 実装の推奨順序

```
1. script defer + window.load 削除 → NO_FCP 解消確認
2. webpack production + devtool 変更 → バンドルサイズ確認
3. babel targets 変更 + tree shaking 有効化
4. Tailwind CSS ビルド時生成
5. フォント woff2 変換 + font-display: swap
6. 画像 WebP 変換
7. 動画 mp4 変換
8. コード分割 + lazy import
9. 不要ライブラリ除去
10. サーバーキャッシュ + 圧縮
```

最初の 3 ステップだけで NO_FCP が解消され、300点を超える可能性が高い。
