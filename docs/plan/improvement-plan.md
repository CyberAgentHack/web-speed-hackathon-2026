# CaX パフォーマンス改善計画

---

## ワークフロー（開発→計測→デプロイの全体像）

### 2つの独立した流れ

```
┌─────────────────────────────────────────────────────────┐
│  ローカル開発 & 計測（改善サイクルの主戦場）              │
│                                                         │
│  コード修正                                              │
│    ↓                                                    │
│  cd application && pnpm run build && pnpm run start     │
│    → localhost:3000 でアプリ起動                         │
│    ↓                                                    │
│  cd scoring-tool && pnpm start \                        │
│    --applicationUrl http://localhost:3000                │
│    → スコアが出る                                       │
│    ↓                                                    │
│  スコア向上 → git commit（採用）                         │
│  スコア悪化 → git checkout .（不採用）                   │
│    ↓                                                    │
│  改善ログ記録 → 次の改善へ                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  デプロイ（本番提出用・タイミングは任意）                 │
│                                                         │
│  git push（自分の fork リポジトリへ）                    │
│    ↓                                                    │
│  CyberAgentHack/web-speed-hackathon-2026 へ PR 作成     │
│    ↓                                                    │
│  GitHub Actions が自動で fly.io にデプロイ               │
│    ↓                                                    │
│  PR の「View Deployment」で本番 URL 確認                 │
│    ↓                                                    │
│  その URL を採点サーバーに登録 → 公式スコア              │
└─────────────────────────────────────────────────────────┘
```

### ポイント
- **改善サイクルはすべてローカル完結**。デプロイ不要
- **PRはデプロイ用**。ある程度スコアが上がったタイミングで push → PR 更新
- ローカルで動作確認＆スコア確認してから push する
- scoring-tool の計測対象は `localhost:3000`（ビルド後のサーバー）

### コマンド早見表

```bash
# --- 初回セットアップ ---
mise trust && mise install
cd application && pnpm install --frozen-lockfile
cd ../scoring-tool && pnpm install --frozen-lockfile

# --- 改善サイクル（毎回） ---
cd application && pnpm run build && pnpm run start  # ビルド＆起動
# （別ターミナル）
cd scoring-tool && pnpm start --applicationUrl http://localhost:3000  # 全計測
cd scoring-tool && pnpm start --applicationUrl http://localhost:3000 --targetName "ホーム"  # 特定ページのみ

# --- VRT（レギュレーション確認） ---
cd application
pnpm --filter "@web-speed-hackathon-2026/e2e" exec playwright install chromium  # 初回のみ
pnpm run test:update  # ベースラインスクリーンショット更新（初回のみ）
pnpm run test         # VRT 実行

# --- デプロイ（本番提出時） ---
git push origin main
# GitHub で PR 作成/更新 → 自動デプロイ
```

---

## 採点構造の理解（最重要）

| 区分 | 満点 | 内訳 | 条件 |
|------|------|------|------|
| ページの表示 | 900点 | 9ページ × 100点（FCP×10, SI×10, LCP×25, TBT×30, CLS×25） | - |
| ページの操作 | 250点 | 5シナリオ × 50点（TBT×25, INP×25） | 表示300点以上で採点 |
| **合計** | **1150点** | | |

**TBT が最重要指標**（表示で30%、操作で50%）。次に LCP（25%）と CLS（25%）。

---

## 改善サイクル（必ず守ること）

```
1. ベースラインスコアを計測・記録
2. 改善を1つだけ実施
3. ローカルで計測（scoring-tool）
4. 結果を記録（変更内容、スコア変化、各指標の変化）
5. 判定：
   - スコア向上 → git commit で採用
   - スコア悪化 → 不採用
6. 改善ログに記録（docs/plan/improvement-log.md）
7. 次の改善へ
```

### 改善ログのフォーマット

```markdown
| # | 改善内容 | Before | After | 差分 | 採用 | 備考 |
|---|---------|--------|-------|------|------|------|
| 1 | webpack mode=production | 120 | 350 | +230 | YES | |
```

---

## 改善タスク一覧（推定改善率の高い順）

---

### TIER 1: 超高インパクト（各タスクでスコア数十〜数百点の改善が期待）

---

#### T01: Webpack mode=production + minify 有効化
- **推定改善**: ★★★★★（最大）
- **対象ファイル**: `application/client/webpack.config.js`
- **現状の問題**:
  - `mode: "none"` → 一切の最適化なし
  - `minimize: false` → JS/CSS 未圧縮
  - `NODE_ENV` が development 相当
- **作業内容**:
  1. `mode: "none"` → `mode: "production"` に変更
  2. `minimize: false` → `minimize: true` に変更（または行削除）
  3. `devtool: "inline-source-map"` → 削除 or `false`（ソースマップをクライアントに送らない）
  4. `EnvironmentPlugin` の `NODE_ENV` を `"production"` に変更
- **注意**: production モードにするだけで tree shaking, minify, scope hoisting 等が全て有効化される
- **リスク**: 低。ただし一部ライブラリが production モードで動作が変わる可能性があるので VRT 確認必須

---

#### T02: コードスプリッティング有効化
- **推定改善**: ★★★★★
- **対象ファイル**: `application/client/webpack.config.js`
- **現状の問題**:
  - `splitChunks: false` → 全コードが1つのバンドルに結合
  - `concatenateModules: false`
  - `usedExports: false`
  - `providedExports: false`
  - `sideEffects: false` (webpack の tree-shaking を無効化している意味)
- **作業内容**:
  1. optimization セクションを以下に変更:
     ```js
     optimization: {
       minimize: true, // T01 で対応済み
       splitChunks: {
         chunks: 'all',
         maxSize: 244000,
       },
       concatenateModules: true,
       usedExports: true,
       providedExports: true,
       sideEffects: true,
     }
     ```
  2. React Router のルートコンポーネントを `React.lazy()` + `Suspense` で動的インポートに変更
     - 対象: `application/client/src/containers/AppContainer.tsx` のルート定義
     - 各ページコンテナ（Home, PostDetail, Search, DM, Crok, TermsOfService 等）を lazy import
- **注意**: splitChunks の設定は段階的に。まず `chunks: 'all'` だけで試す
- **リスク**: 中。ルート分割時に Suspense fallback が CLS を悪化させる可能性あり。fallback は最小限に

---

#### T03: Babel ターゲットをモダンブラウザに変更（polyfill 除去）
- **推定改善**: ★★★★☆
- **対象ファイル**: `application/client/babel.config.js`
- **現状の問題**:
  - `targets` が IE 11 対応 → 大量の polyfill（core-js）が挿入される
  - Chrome 最新版のみ対応すればよい（レギュレーション）
- **作業内容**:
  1. babel.config.js の `targets` を以下に変更:
     ```js
     targets: { chrome: "130" } // または "last 1 Chrome version"
     ```
  2. `useBuiltIns: "usage"` のままでよい（不要な polyfill が自動的に除外される）
  3. もしくは `useBuiltIns: false` にして core-js を完全除去
- **リスク**: 低。Chrome 最新版のみがターゲットなので問題なし

---

#### T04: 巨大 GIF ファイルの動画フォーマット変換（MP4/WebM）
- **推定改善**: ★★★★★（ネットワーク転送量に直結）
- **対象ディレクトリ**: `application/public/movies/`
- **現状の問題**:
  - 動画が GIF 形式で保存（最大26MB/ファイル）
  - 15ファイル合計で約150MB以上
  - GIF はアニメーション動画として極めて非効率
- **作業内容**:
  1. ビルドスクリプトまたは事前処理で全 GIF を MP4（H.264）に変換
     ```bash
     ffmpeg -i input.gif -movflags +faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" output.mp4
     ```
  2. サーバー側の movie 配信エンドポイント（`application/server/src/routes/api/movie.ts`）を修正
     - Content-Type を `video/mp4` に変更
     - ファイルパスを `.mp4` に変更
  3. クライアント側で `<video>` タグの `src` を更新（GIF → MP4）
     - 自動再生: `autoplay muted loop playsinline` 属性を付与
  4. テスト項目確認: 「動画が自動で再生されること」「再生される動画が著しく劣化していないこと」
- **注意**: ffmpeg のオプションで品質を適切に設定（CRF 23〜28程度）。劣化しすぎるとレギュレーション違反
- **リスク**: 中。動画品質の劣化判定は主観的。CRF は控えめに（23程度）開始

---

#### T05: 画像の最適化（リサイズ + WebP/AVIF 変換）
- **推定改善**: ★★★★☆
- **対象ディレクトリ**: `application/public/images/`
- **現状の問題**:
  - JPG 画像が最大7MB（おそらく高解像度）
  - 表示サイズに対して過大な解像度
  - 次世代フォーマット（WebP/AVIF）未使用
- **作業内容**:
  1. 全画像を適切なサイズにリサイズ（表示サイズの2倍程度、max 1200px 幅）
  2. WebP 形式に変換（AVIF はエンコードが遅いので WebP 推奨）
     ```bash
     cwebp -q 80 input.jpg -o output.webp
     ```
  3. サーバー側の image 配信を修正（Content-Type, ファイルパス）
  4. `<img>` タグに `width`, `height` / `aspect-ratio` を明示（CLS 対策）
  5. ファーストビュー外の画像に `loading="lazy"` を追加
- **注意**: 「画像が著しく劣化していないこと」のレギュレーション。品質80以上を推奨
- **リスク**: 中。画質劣化の判定に注意

---

#### T06: Tailwind CSS をビルドタイムに移行（CDN ランタイム JIT 除去）
- **推定改善**: ★★★★☆
- **対象ファイル**: `application/client/src/index.html`, `application/client/webpack.config.js`, `application/client/postcss.config.js`
- **現状の問題**:
  - Tailwind CSS v4 がCDNからブラウザランタイムで JIT 実行
  - `<style type="text/tailwindcss">` でインラインスタイルを記述
  - ページ描画をブロックし、FCP/LCP を大幅に悪化
- **作業内容**:
  1. `@tailwindcss/postcss` をインストール（もしくは既にある場合は設定追加）
     ```bash
     pnpm add -D @tailwindcss/postcss tailwindcss
     ```
  2. `postcss.config.js` に Tailwind プラグインを追加
  3. `index.css` に `@import "tailwindcss"` を追加
  4. `index.html` から CDN `<script>` タグと `<style type="text/tailwindcss">` を削除
  5. HTML 内の Tailwind 設定（カスタムカラー等）を tailwind.config.js / CSS変数に移行
- **注意**: Tailwind v4 は PostCSS プラグインとして使える。v3 とは設定方法が異なる
- **リスク**: 中〜高。Tailwind のクラス名がビルド時に正しく検出されるか確認必須。VRT で差分チェック

---

#### T07: jQuery + bluebird + pako の除去（fetch API に置換）
- **推定改善**: ★★★★☆
- **対象ファイル**: `application/client/src/utils/fetchers.ts`, `application/client/webpack.config.js`
- **現状の問題**:
  - HTTP リクエストに jQuery を使用
  - Promise に bluebird ライブラリを使用
  - リクエストボディを pako で手動 gzip 圧縮
  - `async: false` の jQuery AJAX → メインスレッドをブロック
  - jQuery 自体が約90KB（minified）
- **作業内容**:
  1. `fetchers.ts` を全面書き換え:
     - `jQuery.ajax()` → `fetch()` API に置換
     - `async: false` を排除（非同期に）
     - pako による手動 gzip 圧縮を削除（サーバー側で Content-Encoding 対応すれば不要）
  2. `webpack.config.js` の `ProvidePlugin` から jQuery を削除
  3. `package.json` から `jquery`, `jquery-binarytransport`, `bluebird`, `pako` を削除
  4. サーバー側に `compression` ミドルウェアを追加（Express の gzip 対応）
     ```bash
     pnpm add compression
     ```
     `application/server/src/app.ts` に追加
- **注意**: jQuery が他の箇所でも使われていないか確認（grep で `$` や `jQuery` を検索）
- **リスク**: 中。fetchers.ts を呼び出している全箇所の動作確認が必要

---

#### T08: FFmpeg WASM + ImageMagick WASM の除去/遅延化
- **推定改善**: ★★★★☆
- **対象ファイル**: `application/client/src/utils/load_ffmpeg.ts`, `convert_movie.ts`, `convert_sound.ts`, `convert_image.ts`
- **現状の問題**:
  - FFmpeg WASM（約20MB+）と ImageMagick WASM がクライアントにバンドル
  - 初期ロード時にダウンロード→パース→実行 でメインスレッドを長時間ブロック
  - 投稿機能でのみ使用（全ユーザーが使うわけではない）
- **作業内容**:
  **方針A（推奨）: サーバーサイドでメディア変換**
  1. クライアント側の FFmpeg/ImageMagick WASM 呼び出しを除去
  2. サーバー側に ffmpeg（ネイティブ）を使ったメディア変換エンドポイントを作成
     - 画像: TIFF → JPG 変換（sharp or imagemagick CLI）
     - 動画: MKV → MP4（5秒切り出し、正方形クロップ）
     - 音声: WAV → MP3 変換
  3. クライアントは生ファイルをそのまま POST → サーバーで変換
  4. Dockerfile に ffmpeg をインストール追加

  **方針B（次善）: 動的インポートで遅延読み込み**
  1. FFmpeg/ImageMagick を初期バンドルから除外
  2. 投稿画面を開いた時点で `import()` で動的ロード
  3. webpack の `splitChunks` で別チャンクに分離
- **注意**: テスト項目「TIFF形式の画像を投稿できること」「MKV形式の動画を投稿できること」「WAV形式の音声を投稿できること」を必ず確認
- **リスク**: 高（方針A）/ 中（方針B）。メディア変換の仕様が複雑なため慎重に

---

### TIER 2: 高インパクト（各タスクでスコア数十点の改善が期待）

---

#### T09: moment.js → ネイティブ Date / Intl API に置換
- **推定改善**: ★★★☆☆
- **対象ファイル**: moment を import している全ファイル
- **現状の問題**:
  - moment.js は約300KB（minified + locale含む）
  - ネイティブ API で完全に代替可能
- **作業内容**:
  1. `grep -r "moment" application/client/src/` で使用箇所を特定
  2. 各使用箇所をネイティブ `Date` + `Intl.DateTimeFormat` / `Intl.RelativeTimeFormat` に置換
  3. `package.json` から `moment` を削除
- **リスク**: 低〜中。日付フォーマットの差異に注意

---

#### T10: lodash → ネイティブ JS に置換
- **推定改善**: ★★★☆☆
- **対象ファイル**: lodash を import している全ファイル
- **現状の問題**:
  - lodash 全体がバンドルに含まれている可能性（Tree-shaking 無効のため）
  - 約70KB（minified）
- **作業内容**:
  1. `grep -r "lodash" application/client/src/` で使用箇所を特定
  2. 各関数をネイティブ JS に置換（例: `_.debounce` → 自前実装、`_.get` → optional chaining）
  3. `package.json` から `lodash` を削除
- **リスク**: 低

---

#### T11: 静的アセットのキャッシュヘッダー設定
- **推定改善**: ★★★☆☆
- **対象ファイル**: `application/server/src/routes/static.ts`, `application/server/src/app.ts`
- **現状の問題**:
  - `etag: false`, `lastModified: false`
  - `Cache-Control: max-age=0, no-transform`
  - 全リクエストが毎回フルダウンロード
- **作業内容**:
  1. contenthash 付きのアセット（JS/CSS）に対して長期キャッシュを設定:
     ```
     Cache-Control: public, max-age=31536000, immutable
     ```
  2. HTML に対しては短いキャッシュ or no-cache:
     ```
     Cache-Control: no-cache
     ```
  3. 画像/動画/音声に適切な ETag + キャッシュ設定
  4. Express の `serve-static` オプションを修正
- **リスク**: 低。Lighthouse のスコアに直結する項目

---

#### T12: gzip / Brotli 圧縮の有効化
- **推定改善**: ★★★☆☆
- **対象ファイル**: `application/server/src/app.ts`
- **現状の問題**:
  - レスポンス圧縮が未設定（テキスト系アセットが非圧縮で配信）
- **作業内容**:
  1. `compression` ミドルウェアを追加:
     ```ts
     import compression from 'compression';
     app.use(compression());
     ```
  2. または静的ファイルの事前圧縮（brotli）+ `express-static-gzip` の導入
- **リスク**: 低

---

#### T13: フォントの最適化（サブセット化 + font-display: swap）
- **推定改善**: ★★★☆☆
- **対象ファイル**: `application/public/fonts/`, CSS ファイル
- **現状の問題**:
  - 「例のアレ明朝」フォント（利用規約ページ用）が巨大な可能性
  - KaTeX フォントが全てコピーされている
  - font-display 設定不明
- **作業内容**:
  1. フォントファイルのサイズを確認
  2. 利用規約ページで使用する文字のみにサブセット化
     ```bash
     pyftsubset font.ttf --text-file=terms.txt --output-file=font-subset.woff2 --flavor=woff2
     ```
  3. `@font-face` に `font-display: swap` を追加
  4. KaTeX フォントは Crok ページでのみ使用 → 遅延読み込みに
  5. WOFF2 形式に統一
- **リスク**: 中。「フォントの表示が初期仕様と同じ見た目になっていること」のレギュレーション確認

---

#### T14: API レスポンスの最適化（不要フィールド削除 + N+1 対策）
- **推定改善**: ★★★☆☆
- **対象ファイル**: `application/server/src/routes/api/post.ts`, `application/server/src/models/`
- **現状の問題**:
  - Sequelize のデフォルトスコープで全リレーションを eager loading
  - 不要なフィールドがレスポンスに含まれている可能性
  - 過去の WSH では API レスポンスが 60MB に達した事例あり
- **作業内容**:
  1. 各 API エンドポイントのレスポンスサイズを確認
     ```bash
     curl -s http://localhost:3000/api/v1/posts | wc -c
     ```
  2. クライアントが使用していないフィールドを `attributes` で除外
  3. N+1 クエリを `include` で一括取得に修正
  4. ページネーション（LIMIT/OFFSET）の適切な設定
  5. タイムライン API のレスポンスサイズを最小化
- **リスク**: 中。フィールド削除がクライアント側で参照されていないか確認必須

---

#### T15: 画像の width/height 明示 + CLS 対策
- **推定改善**: ★★★☆☆（CLS 25% のスコアに直結）
- **対象ファイル**: 画像を表示する全 React コンポーネント
- **現状の問題**:
  - 画像に `width`/`height` が未指定 → レイアウトシフト発生
  - プロフィール画像、投稿画像、サムネイル等
- **作業内容**:
  1. 全 `<img>` タグに `width`/`height` 属性を追加
  2. または CSS で `aspect-ratio` を指定
  3. `object-fit: cover` で「写真が枠を覆う形で拡縮」を維持
  4. 動画・音声プレイヤーにも固定サイズを指定
- **リスク**: 低。CLS 改善は VRT と相性がよい（見た目は変わらない）

---

#### T16: react-syntax-highlighter の軽量化
- **推定改善**: ★★★☆☆
- **対象ファイル**: Crok (AI チャット) の Markdown 表示コンポーネント
- **現状の問題**:
  - `react-syntax-highlighter` は全言語のハイライト定義を含む（約1MB+）
  - Crok のコードブロックでのみ使用
- **作業内容**:
  1. `react-syntax-highlighter/dist/esm/light` ビルドに切り替え
  2. 必要な言語のみ個別登録:
     ```ts
     import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
     import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
     SyntaxHighlighter.registerLanguage('javascript', js);
     ```
  3. または Crok ページ自体を lazy load（T02 と組み合わせ）
- **リスク**: 低。使用する言語を適切に登録すれば問題なし

---

#### T17: KaTeX の遅延読み込み
- **推定改善**: ★★☆☆☆
- **対象ファイル**: Crok の Markdown 表示コンポーネント
- **現状の問題**:
  - KaTeX（数式レンダリング）は Crok ページでのみ使用
  - CSS + フォント + JS で数百KB
- **作業内容**:
  1. KaTeX の CSS を動的にロード（Crok ページ表示時）
  2. `rehype-katex` を動的 import
  3. KaTeX フォントの preload を Crok ページのみに限定
- **リスク**: 低

---

### TIER 3: 中インパクト（各タスクでスコア数点〜十数点の改善が期待）

---

#### T18: @mlc-ai/web-llm の除去（Crok の SSE 対応確認）
- **推定改善**: ★★★☆☆
- **対象ファイル**: クライアント側の Crok 関連コンポーネント
- **現状の問題**:
  - `@mlc-ai/web-llm` (Web LLM) が依存に含まれている
  - 巨大なバンドルサイズの一因
  - しかし Crok は SSE (`GET /api/v1/crok{?prompt}`) でサーバーから応答を受け取る設計
- **作業内容**:
  1. `web-llm` がクライアントで実際に使われているか確認
  2. 使われていなければ依存から削除
  3. 使われている場合は、サーバー側 SSE に完全移行（レギュレーションで SSE が必須）
- **リスク**: 低〜中。実際の使用状況次第

---

#### T19: kuromoji / negaposi-analyzer / BM25 のサーバーサイド移行
- **推定改善**: ★★★☆☆
- **対象ファイル**: `application/client/src/utils/bm25_search.ts`, `negaposi_analyzer.ts`
- **現状の問題**:
  - 日本語形態素解析（kuromoji）をクライアントで実行
  - 辞書データ（数MB）をクライアントにダウンロード
  - 検索・感情分析をクライアントで実行 → TBT 悪化
- **作業内容**:
  1. 検索 API（`/api/v1/search`）をサーバー側で BM25 + kuromoji を実行するように変更
  2. ネガポジ分析もサーバー側に移行
  3. クライアント側の kuromoji, negaposi-analyzer, bm25 依存を削除
  4. 辞書データ（`public/dicts/`）のクライアント配信を停止
- **注意**: 検索のテスト項目（「ネガティブなキーワードで検索した場合、どしたん話聞こうか?のメッセージが表示されること」）を確認
- **リスク**: 中

---

#### T20: 音声波形表示の最適化
- **推定改善**: ★★☆☆☆
- **対象ファイル**: 音声関連コンポーネント
- **現状の問題**:
  - `standardized-audio-context` ライブラリが含まれている
  - 波形表示のためにクライアントで AudioContext を使用
  - 音声の波形データをリアルタイム生成 → CPU 負荷
- **作業内容**:
  1. 波形データを事前計算してサーバー側で生成
  2. クライアントは波形データ（JSON/バイナリ）を受け取って描画のみ
  3. または Canvas 描画を最適化（requestAnimationFrame, offscreen canvas）
- **注意**: 「音声の波形が表示されること」「音声の再生位置が波形で表示されること」のレギュレーション
- **リスク**: 中

---

#### T21: Redux + redux-form の軽量化
- **推定改善**: ★★☆☆☆
- **対象ファイル**: `application/client/src/store/`, フォーム関連コンポーネント
- **現状の問題**:
  - Redux（legacy_createStore）+ redux-form はフォーム管理に過剰
  - redux-form 自体が約30KB
- **作業内容**:
  **方針A（安全）**: redux-form → 素の React state に置換
  **方針B（激しめ）**: Redux 全体を React context/state に置換
  - A を推奨。フォームは少数（サインイン、投稿、DM、検索）
- **リスク**: 中。バリデーションロジックの移行が必要

---

#### T22: 画像の lazy loading
- **推定改善**: ★★☆☆☆
- **対象ファイル**: タイムラインの画像表示コンポーネント
- **現状の問題**:
  - 全画像が即時ロード → 初期リクエスト数が膨大
  - ファーストビュー外の画像も先読み
- **作業内容**:
  1. `<img>` タグに `loading="lazy"` を追加（ファーストビュー外）
  2. ファーストビュー内の LCP 候補画像には `fetchpriority="high"` を追加
  3. IntersectionObserver ベースの遅延読み込み（無限スクロール既存なら活用）
- **リスク**: 低

---

#### T23: プリロードヒントの追加
- **推定改善**: ★★☆☆☆
- **対象ファイル**: `application/client/src/index.html`
- **現状の問題**:
  - `<link rel="preload">` や `<link rel="preconnect">` が未設定
  - 重要リソースの発見が遅れる
- **作業内容**:
  1. メインバンドル JS に `<link rel="preload" as="script">` を追加
  2. メイン CSS に `<link rel="preload" as="style">` を追加
  3. LCP 画像候補に `<link rel="preload" as="image">` を追加
  4. API サーバーへの `<link rel="preconnect">` を追加
- **リスク**: 低

---

#### T24: Express の静的ファイル配信最適化
- **推定改善**: ★★☆☆☆
- **対象ファイル**: `application/server/src/routes/static.ts`
- **現状の問題**:
  - history API fallback が全てのリクエストに適用されている可能性
  - 静的ファイルの ETag が無効
- **作業内容**:
  1. 静的ファイルルートの優先度を上げる
  2. ETag を有効化（`etag: true`）
  3. 適切な MIME タイプの設定確認
  4. 可能であれば `express.static` の `maxAge` を設定
- **リスク**: 低

---

#### T25: サーバーサイドレンダリング（SSR）の導入
- **推定改善**: ★★★★☆（FCP, LCP に大きく寄与するが実装コスト高）
- **対象**: アプリケーション全体のアーキテクチャ
- **現状の問題**:
  - 完全な SPA → JS ダウンロード→パース→実行→API fetch→描画 のウォーターフォール
  - FCP/LCP が JS 実行完了後まで遅延
- **作業内容**:
  1. Express サーバーで React の `renderToString` / `renderToPipeableStream` を実行
  2. 初期データをサーバー側で取得し、HTML に埋め込む
  3. クライアント側で `hydrateRoot` を使用
  4. ハイドレーションエラーの解消（サーバー/クライアントの DOM 一致）
- **注意**: 過去 WSH 2025 では上位16名中15名がSSR実装のデグレで失格。極めてリスクが高い
- **リスク**: 非常に高。時間が余っている場合のみ検討。デグレ発生時の切り戻し計画を必ず用意

---

### TIER 4: 低インパクト or 細かい改善（数点の改善）

---

#### T26: PostCSS の browserslist 設定
- **推定改善**: ★☆☆☆☆
- **対象ファイル**: `application/client/postcss.config.js`
- **作業内容**: browserslist を Chrome 最新のみに設定 → 不要な CSS プレフィックスを除去
- **リスク**: 低

---

#### T27: classnames → 素の template literal に置換
- **推定改善**: ★☆☆☆☆
- **対象**: classnames を使用しているコンポーネント
- **作業内容**: `classnames` ライブラリの除去、テンプレートリテラルに置換
- **リスク**: 低

---

#### T28: gifler の除去
- **推定改善**: ★☆☆☆☆
- **対象**: GIF 表示コンポーネント
- **作業内容**: T04 で GIF → MP4 変換後、gifler ライブラリは不要になるため削除
- **リスク**: 低（T04 との依存あり）

---

#### T29: piexifjs の最適化
- **推定改善**: ★☆☆☆☆
- **対象**: 画像投稿時の EXIF 処理
- **作業内容**: サーバーサイドで EXIF 処理する場合はクライアント側の piexifjs を削除
- **リスク**: 低（T08 との依存あり）

---

#### T30: music-metadata の最適化
- **推定改善**: ★☆☆☆☆
- **対象**: 音声投稿時のメタデータ抽出
- **作業内容**: サーバーサイドで処理する場合はクライアント側の music-metadata を削除
- **リスク**: 低（T08 との依存あり）

---

#### T31: image-size の最適化
- **推定改善**: ★☆☆☆☆
- **対象**: 画像サイズ検出
- **作業内容**: サーバーサイドで処理する場合はクライアント側から削除
- **リスク**: 低

---

#### T32: Sequelize クエリの最適化（インデックス追加）
- **推定改善**: ★★☆☆☆
- **対象ファイル**: `application/server/src/models/`, マイグレーション
- **作業内容**:
  1. よく使うクエリの WHERE 句に対応するインデックスを追加
  2. タイムライン取得の ORDER BY に対応するインデックス
  3. 検索クエリの LIKE に対応する FTS（全文検索）
- **リスク**: 低

---

#### T33: WebSocket 接続の最適化
- **推定改善**: ★☆☆☆☆
- **対象**: DM のリアルタイム機能
- **作業内容**: WebSocket 接続を必要な画面でのみ確立（DM画面以外では接続しない）
- **リスク**: 低

---

#### T34: React.memo / useMemo / useCallback の適用
- **推定改善**: ★☆☆☆☆
- **対象**: 頻繁に再レンダリングされるコンポーネント
- **作業内容**: React DevTools Profiler で不要な再レンダリングを特定し、メモ化
- **リスク**: 低

---

#### T35: HTML テンプレートの最適化
- **推定改善**: ★☆☆☆☆
- **対象ファイル**: `application/client/src/index.html`
- **作業内容**:
  1. 不要なインラインスクリプト/スタイルの除去
  2. `<meta>` タグの最適化
  3. `<script defer>` の適切な使用
- **リスク**: 低

---

## 推奨実行順序

### フェーズ0: バンドル縮小（計測なし・一括適用）

> **背景**: 未最適化バンドルが 73.7MB あり、scoring-tool（Chrome）で開くだけで
> PC がメモリ不足で落ちる。計測可能な状態にするため、確実に安全な改善を
> 計測なしでまとめて適用し、バンドルを十分縮小してからベースライン計測を行う。

| 順 | タスク | 内容 | 安全な理由 |
|----|--------|------|-----------|
| 1 | T01 | Webpack production + minimize | **適用済み** |
| 2 | T02 | optimization フラグ有効化（splitChunks, tree shaking 等） | webpack 設定変更のみ |
| 3 | T03 | Babel ターゲットを Chrome 最新 + core-js/regenerator 除去 | babel 設定 + entry 変更のみ |
| 4 | T04 | GIF → MP4 変換 | アセット変換 + 配信コード修正 |
| 5 | T05 | 画像リサイズ + WebP 変換 | アセット変換 + 配信コード修正 |
| 6 | T06 | Tailwind CDN → ビルドタイム移行 | ビルド設定変更。VRT 要確認 |
| 7 | T07 | jQuery/bluebird/pako 除去 → fetch API | ライブラリ置換 |
| 8 | T08 | FFmpeg/ImageMagick WASM 遅延化 | 動的 import に変更 |
| 9 | T09 | moment.js → ネイティブ Date | ライブラリ置換 |
| 10 | T10 | lodash → ネイティブ JS | ライブラリ置換 |

**フェーズ0 完了後にやること:**
1. `pnpm run build` でバンドルサイズを確認（目標: main.js < 5MB）
2. `pnpm run start` → scoring-tool で「ホーム」1ページだけ計測
3. PC が耐えたら全ページ計測 → これがベースラインスコア
4. ベースラインを `improvement-log.md` に記録
5. 以降は通常の「1改善→計測→判定」サイクルに移行

---

### フェーズ1: サーバー・配信最適化（計測しながら1つずつ）
1. **T12**: gzip 圧縮有効化
2. **T11**: キャッシュヘッダー設定
3. **T15**: width/height 明示（CLS 対策）
4. **T22**: 画像 lazy loading
5. **T14**: API レスポンス最適化

### フェーズ2: 残りの依存ライブラリ削減
6. **T16**: react-syntax-highlighter 軽量化
7. **T17**: KaTeX 遅延読み込み
8. **T18**: web-llm 除去
9. **T19**: kuromoji/BM25 サーバーサイド移行

### フェーズ3: CSS/フォント/HTML 最適化
10. **T13**: フォント最適化
11. **T23**: プリロードヒント追加
12. **T26**: PostCSS browserslist 設定
13. **T35**: HTML テンプレート最適化

### フェーズ4: バックエンド・細かい改善
14. **T32**: DB インデックス追加
15. **T24**: 静的ファイル配信最適化
16. **T20**: 音声波形最適化
17. **T21**: redux-form 軽量化
18. **T27〜T34**: 小さな改善

### フェーズ5: ハイリスク・ハイリターン（時間に余裕がある場合のみ）
19. **T25**: SSR 導入（デグレリスクが極めて高い。必ず切り戻し計画を用意）

---

## 計測方法

### ローカル計測（メイン）

```bash
# 1. アプリをビルド＆起動（localhost:3000）
cd application && pnpm run build && pnpm run start

# 2. 別ターミナルで scoring-tool 実行
cd scoring-tool && pnpm start --applicationUrl http://localhost:3000

# 特定ページだけ計測（高速に回したいとき）
cd scoring-tool && pnpm start --applicationUrl http://localhost:3000 --targetName "ホーム"

# 計測名一覧を確認
cd scoring-tool && pnpm start --applicationUrl http://localhost:3000 --targetName
```

### Lighthouse CLI（補助的に使う場合）

```bash
npx lighthouse http://localhost:3000 --output=json --output-path=./report.json
```

### 本番環境の計測

```bash
# fly.io にデプロイ済みの URL に対して
cd scoring-tool && pnpm start --applicationUrl https://<your-app>.fly.dev
```

---

## レギュレーション遵守チェック（改善のたびに実施）

| # | チェック項目 | コマンド/方法 |
|---|-------------|---------------|
| 1 | VRT テスト | `cd application && pnpm run test` |
| 2 | 手動テスト主要項目 | `docs/test_cases.md` を目視確認 |
| 3 | 初期化 API | `curl -X POST http://localhost:3000/api/v1/initialize` |
| 4 | Crok SSE | ブラウザで Crok ページを開き、メッセージ送信→ストリーミング応答を確認 |
| 5 | fly.toml 未変更 | `git diff fly.toml` で差分なし |
| 6 | 動画自動再生 | ホーム・投稿詳細で動画が自動再生されるか |
| 7 | 音声波形表示 | ホーム・投稿詳細で波形が描画されるか |
| 8 | 写真表示 | 画像が枠を覆う形で表示されるか（object-fit: cover） |

> **重要**: 過去の WSH では上位入賞者の大半がレギュレーション違反で失格している。
> スコア改善よりもレギュレーション遵守を優先すること。
