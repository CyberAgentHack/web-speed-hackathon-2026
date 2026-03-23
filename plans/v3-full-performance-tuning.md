# Plan: v3 — 本格パフォーマンスチューニング

## Context

v2 でバンドル分割 + gzip 圧縮を行ったが、FCP/LCP/SI は依然 0点 (229点, v1 の 240点より低下)。
調査の結果、**JS の問題だけでなく、描画をブロックする複数の根本原因** が判明した。

v3 では最もインパクトの大きい問題から順に全て対処する。

## ボトルネック分析 (優先度順)

### P0: 描画を完全にブロックしている問題

| # | 問題 | 影響 | 削減効果 |
|---|------|------|---------|
| 1 | **Tailwind CSS ブラウザランタイム** (`<script src="cdn.jsdelivr.net/@tailwindcss/browser">`) — ブラウザ内で CSS をコンパイル。blocking script。 | FCP, LCP, TBT, SI 全て | CDN 往復 + CSS コンパイル時間を完全排除 |
| 2 | **`async: false` 同期 XHR** (`fetchers.ts`) — jQuery の同期 AJAX がメインスレッドを完全ブロック | TBT (30点配分) | メインスレッドブロッキング解消 |
| 3 | **blocking script タグ** (`scriptLoading: "blocking"`) — 全 JS を `<head>` で同期読み込み | FCP, LCP | JS パース完了前に HTML を描画可能に |

### P1: 初期バンドルの肥大化

| # | 問題 | サイズ | 対処 |
|---|------|--------|------|
| 4 | `@mlc-ai/web-llm` が静的 import | ~5MB | dynamic import() |
| 5 | `negaposi-analyzer-ja` 辞書 (4.2MB JSON) 静的埋め込み | ~4.2MB | dynamic import() |
| 6 | `core-js` エントリポイントで全量読み込み | 大 | useBuiltIns: "usage" or 削除 |
| 7 | `standardized-audio-context` ProvidePlugin で常時注入 | 中 | ProvidePlugin から削除、native AudioContext 使用 |
| 8 | `moment` (60KB min) 全ページで使用 | 中 | dayjs (2KB) に置換 |
| 9 | `lodash` (72KB min) SoundWaveSVG で使用 | 中 | ネイティブ JS に置換 |
| 10 | `jquery` + `jquery-binarytransport` — fetchers.ts + ProvidePlugin | ~88KB | fetch API に置換 |

### P2: レスポンス配信の最適化

| # | 問題 | 影響 |
|---|------|------|
| 11 | **Cache-Control: max-age=0** — 全レスポンスでキャッシュ無効 | 毎回フルリロード |
| 12 | **Connection: close** — HTTP Keep-Alive 無効 | 接続ごとに TCP ハンドシェイク |
| 13 | **etag: false, lastModified: false** — 条件付きリクエスト不可 | 304 が使えない |
| 14 | 画像を `<img>` ではなく同期 XHR → Blob URL で描画 (`CoveredImage.tsx`) | LCP, TBT |

---

## 実施内容 (v3 で全て対処)

### 施策 A: Tailwind CSS ビルド時コンパイル

**なぜ**: `@tailwindcss/browser` はブラウザ内 CSS コンパイラ。CDN から JS をダウンロード → CSS をパース → スタイル生成 を全てメインスレッドで実行。FCP が始まらない最大原因の一つ。

**方法**:
1. `index.html` から `<script src="cdn.jsdelivr.net/@tailwindcss/browser">` を削除
2. `<style type="text/tailwindcss">` の内容を `index.css` に移動
3. PostCSS + Tailwind CSS のビルド時コンパイルに一本化 (webpack の postcss-loader は既に設定済)
4. `@tailwindcss/postcss` (Tailwind v4) をインストールし、`postcss.config.js` に追加

**修正ファイル**:
- `client/src/index.html` — ブラウザランタイム script 削除、inline style 削除
- `client/src/index.css` — Tailwind テーマ・ユーティリティ定義を移動
- `client/postcss.config.js` — `@tailwindcss/postcss` 追加
- `client/package.json` — `@tailwindcss/postcss` 依存追加

### 施策 B: 同期 XHR の排除 + jQuery 置換

**なぜ**: `fetchers.ts` の `$.ajax({ async: false })` はメインスレッドを完全ブロックする。これが TBT (30点配分) を壊滅させている。jQuery 自体も 88KB の不要な依存。

**方法**:
1. `fetchers.ts` の `fetchJSON`, `sendJSON`, `fetchBinary` を全て `fetch()` API に置換
2. `async: false` を排除 (非同期に)
3. `pako` による gzip 圧縮は `CompressionStream` API に置換 (ブラウザネイティブ)
4. `jquery`, `jquery-binarytransport` をエントリから削除
5. webpack ProvidePlugin から `$`, `window.jQuery` を削除

**修正ファイル**:
- `client/src/utils/fetchers.ts` — fetch API ベースに全面書き換え
- `client/webpack.config.js` — エントリから `jquery-binarytransport` 削除、ProvidePlugin から jQuery 削除

### 施策 C: script タグの defer 化

**なぜ**: `scriptLoading: "blocking"` で全 JS が `<head>` で同期実行される。HTML パース前に JS 実行が完了するまで何も表示されない。

**方法**: HtmlWebpackPlugin の `scriptLoading` を `"defer"` に変更。

**修正ファイル**:
- `client/webpack.config.js` — `scriptLoading: "defer"`

### 施策 D: 重量モジュールの dynamic import 化

**なぜ**: 初期バンドル (542.js) に 5MB の web-llm、4.2MB の辞書 JSON 等が含まれている。これらは初期描画に不要。

**方法**:
1. `create_translator.ts` — `import { CreateMLCEngine }` を関数内の `await import()` に変更
2. `negaposi_analyzer.ts` — `analyzeSentiment` 内で `await import("negaposi-analyzer-ja")` に変更
3. `SoundWaveSVG.tsx` — lodash の `_.map`, `_.zip`, `_.chunk`, `_.mean`, `_.max` をネイティブ JS に置換

**修正ファイル**:
- `client/src/utils/create_translator.ts`
- `client/src/utils/negaposi_analyzer.ts`
- `client/src/components/foundation/SoundWaveSVG.tsx`

### 施策 E: エントリポイントの軽量化

**なぜ**: `core-js` 全量読み込み + `regenerator-runtime` がエントリに含まれている。モダンブラウザでは不要。

**方法**:
1. エントリから `core-js`, `regenerator-runtime/runtime` を削除
2. Babel の `useBuiltIns: "usage"` を設定し、必要な polyfill のみ自動注入
3. ProvidePlugin から `AudioContext` (`standardized-audio-context`) を削除 — ネイティブ AudioContext 使用
4. ProvidePlugin から `Buffer` を削除 — 必要箇所のみ直接 import

**修正ファイル**:
- `client/webpack.config.js` — エントリ配列、ProvidePlugin
- `client/babel.config.js` — `useBuiltIns: "usage"`

### 施策 F: moment → dayjs 置換

**なぜ**: moment (60KB min) が 6 ファイルで使用。dayjs (2KB) で完全互換置換可能。

**方法**: `moment()` を `dayjs()` に置換。`moment().fromNow()` → `dayjs().fromNow()` (relativeTime プラグイン)。

**修正ファイル**:
- `client/src/components/post/PostItem.tsx`
- `client/src/components/post/CommentItem.tsx`
- `client/src/components/user/UserProfileHeader.tsx`
- その他 moment を import しているファイル
- `client/package.json` — dayjs 依存追加

### 施策 G: 静的ファイルのキャッシュヘッダ最適化

**なぜ**: 全レスポンスで `Cache-Control: max-age=0`, `Connection: close` が設定され、etag/lastModified も無効。ブラウザキャッシュが一切効かない。

**方法**:
1. `app.ts` のグローバル Cache-Control ヘッダを削除
2. `Connection: close` を削除
3. `static.ts` で dist/ のハッシュ付きアセットに `max-age=31536000, immutable` を設定
4. public/ のメディアファイルに適切な `max-age` を設定
5. `etag: true` を有効化

**修正ファイル**:
- `server/src/app.ts` — グローバルヘッダ変更
- `server/src/routes/static.ts` — serveStatic オプション変更

### 施策 H: CoveredImage の native img 化

**なぜ**: 画像を同期 XHR で取得 → Blob URL → `<img>` で描画している。ブラウザのネイティブ画像読み込み (プリロード、キャッシュ、ハードウェアデコード) を全て無視。LCP を壊滅させる。

**方法**: `CoveredImage.tsx` を通常の `<img src={url}>` に変更。EXIF の alt テキスト取得は API 側から返すか、別途非同期で行う。

**注意**: EXIF から alt テキストを取得するロジックがあるため、画像の代替テキスト表示が変わる可能性。VRT で慎重に確認。

**修正ファイル**:
- `client/src/components/foundation/CoveredImage.tsx`

---

## 修正対象ファイル一覧

| ファイル | 施策 |
|---------|------|
| `client/src/index.html` | A |
| `client/src/index.css` | A |
| `client/postcss.config.js` | A |
| `client/package.json` | A, F |
| `client/src/utils/fetchers.ts` | B |
| `client/webpack.config.js` | B, C, E |
| `client/babel.config.js` | E |
| `client/src/utils/create_translator.ts` | D |
| `client/src/utils/negaposi_analyzer.ts` | D |
| `client/src/components/foundation/SoundWaveSVG.tsx` | D |
| `client/src/components/post/PostItem.tsx` | F |
| `client/src/components/post/CommentItem.tsx` | F |
| `client/src/components/user/UserProfileHeader.tsx` | F |
| `server/src/app.ts` | G |
| `server/src/routes/static.ts` | G |
| `client/src/components/foundation/CoveredImage.tsx` | H |

## 期待効果

| 指標 | v2 (現状) | v3 (予想) |
|------|----------|----------|
| 初期 JS サイズ (gzip) | ~2.3 MB | ~200-500 KB |
| FCP | 0点 | スコアあり |
| LCP | 0点 | スコアあり |
| SI | 0点 | スコアあり |
| TBT | 0-18点 | 大幅改善 |
| 表示スコア合計 | 229点 | **400-600点** (300点超え確実) |
| ユーザーフロー | スキップ | **計測可能** |

## 検証手順

1. `cd application && pnpm run build` — ビルド成功確認
2. `ls -lh dist/scripts/` — 初期チャンクサイズ確認 (目標: main.js < 500KB)
3. サーバー再起動 → `http://localhost:3000/` 動作確認
4. DevTools Network: Tailwind CDN への通信がないこと確認
5. DevTools Console: 同期 XHR の deprecation warning がないこと確認
6. scoring-tool: `cd scoring-tool && pnpm start --applicationUrl http://localhost:3000`
7. VRT: `cd application/e2e && pnpm run test:update 2>&1 | tee ../../regression/v3-local.txt`
8. 全テスト passed を確認後 commit & push

## リスク・注意点

- **施策 A (Tailwind)**: CSS の見た目が変わるリスクが最も高い。VRT で厳密に確認。未実施（v3.1 で対応予定）。
- **施策 B (jQuery 除去)**: `fetchers.ts` は全コンテナで使用。非同期化により描画タイミングが変わる可能性。
- **施策 H (CoveredImage)**: EXIF alt テキスト取得の代替手段が必要。画像に alt が表示されなくなる可能性。
- **施策 D**: dynamic import のタイミングで一瞬のローディングが見える可能性があるが、Suspense fallback で対処。
- **機能落ち**: 運営から多くの参加者に機能落ちが見られると警告あり。全施策後に VRT + 手動テストケースを必ず確認。

---

## 実施結果

### 実施済み施策 (v3)

| 施策 | 状態 | 備考 |
|------|------|------|
| B: jQuery + 同期XHR 除去 → fetch API | 完了 | `fetchers.ts` を全面書き換え。pako → CompressionStream API。エラーハンドリング追加。 |
| C: script defer 化 | 完了 | `scriptLoading: "defer"` |
| D: 重量モジュール dynamic import 化 | 完了 | web-llm, negaposi-analyzer-ja+kuromoji+bluebird を dynamic import。lodash → ネイティブ JS。 |
| E: エントリポイント軽量化 | 完了 | core-js, regenerator-runtime, jquery-binarytransport 削除。AudioContext ProvidePlugin 削除。 |
| F: moment → dayjs 置換 | 完了 | 6ファイル。`format("LL")` → `format("YYYY年M月D日")`。relativeTime プラグイン使用。 |
| G: キャッシュヘッダ最適化 | 完了 | Connection: close 削除。etag/lastModified 有効化。ハッシュ付きアセットに immutable。 |
| H: CoveredImage native img 化 | 完了 | `<img src={url} className="object-cover">` に変更。EXIF alt 取得は非同期で維持。image-size, classnames 依存を除去。 |

### 未実施施策

| 施策 | 理由 |
|------|------|
| A: Tailwind CSS ビルド時コンパイル | CSS の見た目変更リスクが高い。v3.1 で対応予定。 |

### 追加で行った変更 (プラン外)

- `fetchers.ts` にエラーハンドリング追加 (`!res.ok` で throw) — fetch API 移行で 401 レスポンスがクラッシュを引き起こしたため
- `CoveredImage.tsx` で `sizeOf`, `classnames` 依存を除去し、CSS `object-cover` で代替

### ビルド結果

| 指標 | v2 | v3 |
|------|-----|-----|
| エントリポイント合計 | 6.65 MB | **570 KB** (91% 削減) |
| vendor chunk (gzip) | 2.3 MB | **~160 KB** |
| main.js (gzip) | 24 KB | 25 KB |

### Lighthouse ローカル計測 (施策 B,C,D,E のみ時点)

| 指標 | v1 | v3 |
|------|-----|-----|
| FCP | 90.3秒 (0点) | **0.6秒 (0.99点)** |
| LCP | 231.6秒 (0点) | 127.9秒 (0点) — GIF の巨大転送が原因 |
| TBT | 7,830ms (0点) | 5,810ms (0点) — Tailwind ランタイム + GIF デコードが原因 |
| Performance Score | 7/100 | **17/100** |
