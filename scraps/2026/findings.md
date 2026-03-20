# WSH 2026 調査メモ

競技中に発見した仕込み・問題点を記録する。対応状況は [`progress.md`](./progress.md) を参照。

---

## ビルド設定の無効化 (仕込み)

複数層にわたって production ビルドが無効化されていた。

| 仕込み箇所 | 内容 |
| --- | --- |
| `webpack.config.js` | `mode: "none"` + `devtool: "inline-source-map"` |
| `client/package.json` build script | `NODE_ENV=development webpack` (NODE_ENV を強制上書き) |
| `Dockerfile` build ステージ | `ENV NODE_ENV=production` が無かった |
| `client/src/index.html` | `<script>` タグに `defer` が無かった |
| `webpack.config.js` entry | `core-js`・`regenerator-runtime` が直接含まれていた |

---

## クライアントの巨大 WASM (仕込み)

| ライブラリ | 用途 | 推定サイズ |
| --- | --- | --- |
| `@ffmpeg/core` + `@ffmpeg/ffmpeg` | 動画・音声変換 | ~30MB |
| `@imagemagick/magick-wasm` | 画像変換 (TIFF→JPEG) | ~14MB |
| `@mlc-ai/web-llm` | 翻訳 ("Show Translation" 機能) | ~13MB |

---

## 意図的な遅延

| 場所 | 内容 | 影響 |
| --- | --- | --- |
| `server/src/routes/api/crok.ts` | `await sleep(3000)` | **仕様** (AI が考える時間として意図的) — 除去禁止 |
| `server/src/routes/api/crok.ts` | `await sleep(10)` × 文字数 | **仕様** (SSE フラッシュも兼ねる) — 除去禁止 |
| `client/src/components/direct_message/DirectMessagePage.tsx` | `setInterval(() => {...}, 1)` | 毎ミリ秒スクロール監視・TBT 大幅増加 |
| `client/src/components/foundation/AspectRatioBox.tsx` | `setTimeout(calcStyle, 500)` | 500ms 描画遅延・CLS |

---

## ReDoS の疑い (仕込み)

`validation.ts`・`services.ts` の 4 箇所にパスワードバリデーションの脆弱な正規表現。

---

## 重い依存ライブラリ

| ライブラリ | 理由 | 代替案 |
| --- | --- | --- |
| `moment` | ~300KB | `day.js` |
| `lodash` | 544 KB (全体 import) | ネイティブ JS (`SoundWaveSVG.tsx` で使用) |
| `standardized-audio-context` | **466 KB** | 不要 — `AudioContext` はモダンブラウザにネイティブ実装。`webpack.config.js` の `ProvidePlugin` でグローバル注入されている仕込み |
| `jquery` + `jquery-binarytransport` | 285 + 48 KB | `fetch` に置き換え (`fetchers.ts`) |
| `bluebird` | 183 KB | `gifler` (→ `PausableMovie.tsx`) の依存として流入。GIF → WebM/MP4 変換で `gifler` ごと除去できる |
| `moment` | 176 KB | `day.js` |
| `piexifjs` | 79 KB | `CoveredImage.tsx` で使用。用途要確認 |
| `kuromoji` | 形態素解析 (辞書込みで重い) | サーバー側に移行 (**対応済み**) |
| `negaposi-analyzer-ja` | 感情極性分析 | サーバー側に移行 (**対応済み**) |
| `bayesian-bm25` | BM25 検索 (Crok サジェスト) | サーバー側に移行 (**対応済み**) |
| `@mlc-ai/web-llm` | フロント LLM 翻訳 | `POST /api/v1/translate` に移行 (**対応済み**) |
| `react-syntax-highlighter` | シンタックスハイライト (全言語バンドル) | `React.lazy` で遅延分離 (**対応済み**) |

`kuromoji` + `negaposi-analyzer-ja` は検索画面の「ネガポジ判定」および Crok のサジェスト絞り込みで使用。

### `fetchers.ts` の仕込み

`fetchers.ts` の全関数が `$.ajax({ async: false })` (同期 XHR) を使用。リクエスト中メインスレッドをブロックするため TBT が大幅に増加する。`fetch` に置き換えれば `jquery` + `jquery-binarytransport` も除去できる。

また `sendJSON` は `pako` で gzip 圧縮したリクエストを送信している (`Content-Encoding: gzip`)。サーバー側の対応状況を確認してから除去すること。

---

## HAR 解析結果 (2026-03-20, `initial.har`)

リクエスト数: 67 件

| サイズ | 重複 | URL |
| --- | --- | --- |
| **107.8 MB** | - | `scripts/main.js` |
| 25 MB | **×2** | `movies/51a14d70...gif` |
| 17.3 MB | - | `movies/b44e6ef6...gif` |
| 13.2 MB | - | `movies/1b558288...gif` |
| 10.5 MB | **×2** | `movies/3cb50e48...gif` |
| 8.6 MB | - | `sounds/5d0cd8a0...mp3` |
| 8.2 MB | - | `movies/7518b1ae...gif` |
| 6.7 MB | **×2** | `images/85946f86...jpg` |
| 5.6 MB | **×2** | `images/029b4b75...jpg` |
| 5 MB | **×2** | `images/eb487309...jpg` |
| 4.2 MB | **×4** | `images/18358ca6...jpg` |
| 2.4 MB | - | `api/v1/posts` |

- **動画コンテンツが GIF で配信** — `movies/` が全て `.gif`。WebM/MP4 に変換必須
- **同一リソースが最大 4 回リクエスト** — キャッシュ未設定またはコンポーネントが同じ URL を複数回 fetch
- **JPEG 画像が生サイズで配信** — 最大 6.7 MB。AVIF/WebP + リサイズ必須
- **MP3 音声が 8.6 MB** — Opus (.webm) に変換すれば 1/5 程度に削減可能
- **`api/v1/posts` が 2.4 MB** — 不要フィールドの削除・ページネーション見直し要

---

## 初期スコア (2026-03-20)

**合計: 247.95 / 1150.00**

ページの表示が 300 点未満のためユーザーフローテストは全てスキップ。
FCP / LCP / SI / TBT がほぼ全ページ 0 点 = Lighthouse が真っ白な画面を完成状態と誤認している典型パターン。

| ページ | CLS | FCP | LCP | SI | TBT | 合計 |
| --- | --- | --- | --- | --- | --- | --- |
| ホーム | 21.25 | 0 | 0 | 0 | 0 | 21.25 |
| 投稿詳細 | 25.00 | 0 | 0 | 0 | 0 | 25.00 |
| 写真つき投稿詳細 | 24.75 | 0 | 0 | 0 | 0 | 24.75 |
| 動画つき投稿詳細 | 23.75 | 0 | 0 | 0 | 0 | 23.75 |
| 音声つき投稿詳細 | 25.00 | 0 | 0 | 0 | 0 | 25.00 |
| 検索 | 25.00 | 0 | 0 | 0 | 0 | 25.00 |
| DM一覧 | 25.00 | 0 | 0 | 0 | 0 | 25.00 |
| DM詳細 | 25.00 | 0 | 0 | 0 | 0 | 25.00 |
| 利用規約 | 25.00 | 0 | 0 | 0 | 28.20 | 53.20 |

---

## ローカル計測スコア (2026-03-20, Phase 1〜3 + web-llm 除去後)

**合計: 220.10 / 1150.00**

ページの表示が 300 点未満のためユーザーフローテストは全てスキップ。
FCP / LCP / SI / TBT は依然ほぼ全ページ 0 点。初期スコアより低いのはローカル環境の CPU/ネットワーク差によるもので、ビルド改善の効果はまだスコアに現れていない。

| ページ | CLS | FCP | LCP | SI | TBT | 合計 |
| --- | --- | --- | --- | --- | --- | --- |
| ホーム | 21.00 | 0 | 0 | 0 | 0 | 21.00 |
| 投稿詳細 | 25.00 | 0 | 0 | 0 | 0 | 25.00 |
| 写真つき投稿詳細 | 24.75 | 0 | 0 | 0 | 0 | 24.75 |
| 動画つき投稿詳細 | 23.75 | 0 | 0 | 0 | 0 | 23.75 |
| 音声つき投稿詳細 | 25.00 | 0 | 0 | 0 | 0 | 25.00 |
| 検索 | 25.00 | 0 | 0 | 0 | 0 | 25.00 |
| DM一覧 | 25.00 | 0 | 0 | 0 | 0 | 25.00 |
| DM詳細 | 25.00 | 0 | 0 | 0 | 0 | 25.00 |
| 利用規約 | 25.00 | 0 | 0 | 0 | 0.60 | 25.60 |
