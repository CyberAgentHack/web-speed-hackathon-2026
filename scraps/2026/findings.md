# WSH 2026 調査メモ

競技中に発見した仕込み・問題点・対応状況をここに記録する。

---

## Phase 0 調査結果 (2026-03-20)

### 🔴 超重大: ビルド設定が全て無効化されている

`application/client/webpack.config.js` が壊滅的な状態。

```js
mode: 'none'                    // production どころか none
devtool: 'inline-source-map'    // ソースマップをインライン埋め込み
minimize: false                 // minify なし
splitChunks: false              // チャンク分割なし
concatenateModules: false       // tree shaking なし
usedExports: false              // dead code 除去なし
sideEffects: false              // sideEffects 最適化なし
NODE_ENV: 'development' 固定    // React の dev ビルドが入る
```

さらに build スクリプトも `NODE_ENV=development webpack` となっており、
`EnvironmentPlugin` でも `NODE_ENV: 'development'` がハードコードされている。

**対応**: Phase 1 で全部 production 設定に直す。

---

### 🔴 超重大: クライアントに巨大 WASM 3 本

| ライブラリ                        | 用途                           | 使用箇所                                | 推定サイズ |
| --------------------------------- | ------------------------------ | --------------------------------------- | ---------- |
| `@ffmpeg/core` + `@ffmpeg/ffmpeg` | 動画・音声変換                 | `client/src/utils/load_ffmpeg.ts`       | ~30MB      |
| `@imagemagick/magick-wasm`        | 画像変換 (TIFF→PNG 等)         | `client/src/utils/convert_image.ts`     | 数十 MB    |
| `@mlc-ai/web-llm`                 | 翻訳 ("Show Translation" 機能) | `client/src/utils/create_translator.ts` | 数百 MB    |

これらは **投稿時にのみ** 使用される。投稿処理をサーバー側に移すことで削除できる。

**対応方針**: Phase 2 で削除 → サーバー側 (FFmpeg/ImageMagick) に移行。

---

### 🔴 重大: 意図的な遅延 (仕込み) 4 箇所

| 場所                                                               | 内容                          | 影響                                        |
| ------------------------------------------------------------------ | ----------------------------- | ------------------------------------------- |
| `server/src/routes/api/crok.ts:37`                                 | `await sleep(3000)`           | Crok の TTFT が 3 秒                        |
| `server/src/routes/api/crok.ts:45`                                 | `await sleep(10)` × 文字数    | Crok の全文送信が数十秒                     |
| `client/src/components/direct_message/DirectMessagePage.tsx:77-83` | `setInterval(() => {...}, 1)` | 毎ミリ秒スクロール監視、TBT 大幅増加        |
| `client/src/components/foundation/AspectRatioBox.tsx:22`           | `setTimeout(calcStyle, 500)`  | アスペクト比ボックスが 500ms 描画遅延 → CLS |

#### crok.ts の sleep

```ts
// TTFT (Time to First Token)
await sleep(3000); // ← 仕込み: 削除してよい

for (const char of response) {
  // ...
  await sleep(10); // ← 仕込み: 削除してよい (SSE プロトコル自体は維持)
}
```

レギュレーション上「SSE プロトコルを変更してはならない」が、`sleep` は
プロトコルではないので**削除可能**。

#### DirectMessagePage.tsx の setInterval

```ts
const id = setInterval(() => {
  const height = Number(
    window.getComputedStyle(document.body).height.replace("px", ""),
  );
  if (height !== scrollHeightRef.current) {
    scrollHeightRef.current = height;
    window.scrollTo(0, height);
  }
}, 1); // ← 1ms = 毎ミリ秒実行
```

スクロール位置を最下部に保つための処理。`MutationObserver` または
メッセージ送信後に `scrollTo` を呼ぶ形に置き換えれば削除できる。

> [!WARNING]
> `scraps/traps.md` に「スクロール位置が保存されているか確認」が最終確認項目にある。
> この `setInterval` を削除する場合は DM 画面の「初期表示で最下部へスクロール」
> 「新規メッセージ受信時に最下部へスクロール」を別手段で担保すること。

#### AspectRatioBox.tsx の setTimeout

```ts
setTimeout(() => calcStyle(), 500); // ← 仕込み: 0 に変更 or CSS aspect-ratio に移行
```

CSS `aspect-ratio` プロパティで JS なしに置き換えられる可能性あり。
ただし「親要素の横幅を基準にして高さを決める」用途なので確認要。

**対応**: Phase 3 で削除。

---

### 🟡 ReDoS の疑い: パスワードバリデーション

`client/src/auth/validation.ts:16`

```js
/^(?:[^\P{Letter}&&\P{Number}]*){16,}$/v;
```

`(?:...)*{16,}` という二重量指定子。Unicode set notation (`/v`) を使った
複雑なパターンで、長い入力に対してバックトラッキング爆発の可能性がある。

**対応方針**: 同等の意味で ReDoS にならない書き方に書き換える。
`[^\P{Letter}&&\P{Number}]` = 文字または数字 = `[\p{Letter}\p{Number}]` 相当なので、
`/^[\p{Letter}\p{Number}]{16,}$/v` に書き換えれば同等かつ安全。

---

### 🟡 重い依存ライブラリ一覧

| ライブラリ                          | 理由                        | 代替                  |
| ----------------------------------- | --------------------------- | --------------------- |
| `moment`                            | ~300KB                      | `day.js`              |
| `lodash`                            | ~70KB (全体 import)         | ネイティブ JS         |
| `jquery` + `jquery-binarytransport` | ~87KB                       | `fetch`               |
| `bluebird`                          | Promise ライブラリ          | ネイティブ `Promise`  |
| `kuromoji`                          | 形態素解析 (辞書込みで重い) | サーバー側に移行      |
| `negaposi-analyzer-ja`              | 感情極性分析                | サーバー側に移行      |
| `core-js`                           | Polyfill                    | browserslist で削減   |
| `regenerator-runtime`               | async/await polyfill        | browserslist で不要に |

`kuromoji` + `negaposi-analyzer-ja` は検索画面の「ネガポジ判定」で使用。
サーバー側に移せれば大幅削減できる。

---

### ℹ️ その他気になる点

- `AspectRatioBox` で `passive: false` の resize イベント登録
- `chunkFormat: false` でチャンク分割が無効化されている
- `entry` に `core-js` と `regenerator-runtime` が直接含まれている
- `cache: false` でビルドキャッシュが無効 (ビルド時間が長い)

---

## HAR 解析結果 (2026-03-20, `initial.har`)

リクエスト数: 67 件

### サイズ上位 (重複込み)

| サイズ | 重複 | URL |
|-------|------|-----|
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
| 2.4 MB | - | `api/v1/posts` (API レスポンスが 2.4MB) |

### 発見事項

- **main.js が 107.8 MB** — WASM 3 本 + 未 minify + dev ビルドの合算
- **動画コンテンツが GIF で配信されている** — `movies/` が全て `.gif`。WebM/MP4 に変換必須
- **同一リソースが最大 4 回リクエストされている** — キャッシュが効いていないか、コンポーネントが同じ URL を複数回 fetch している
- **JPEG 画像が生サイズで配信** — 最大 6.7 MB。AVIF/WebP + リサイズ必須
- **MP3 音声が 8.6 MB** — Opus (.webm) に変換すれば 1/5 程度に削減可能
- **`api/v1/posts` が 2.4 MB** — API レスポンス自体が重い。不要フィールドの削除・ページネーション見直し要

---

## 初期スコア (2026-03-20)

**合計: 247.95 / 1150.00**

ページの表示が 300 点未満のためユーザーフローテストは全てスキップ。
FCP / LCP / SI / TBT がほぼ全ページ 0 点 = Lighthouse が真っ白な画面を完成状態と誤認している典型パターン。
CLS だけは大半のページで満点近く取れている。

| ページ | CLS | FCP | LCP | SI | TBT | 合計 |
|-------|-----|-----|-----|----|-----|------|
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

## TODO (優先順)

- [ ] Phase 1: webpack → production mode / inline-source-map 削除 / NODE_ENV 修正
- [ ] Phase 2: WASM 3 本をサーバー側処理に移行
- [ ] Phase 3: `sleep` 3 箇所を削除
- [ ] Phase 3: `setInterval(..., 1)` を `MutationObserver` 等に置換
- [ ] Phase 3: `setTimeout(calcStyle, 500)` を削除 or CSS 化
- [ ] Phase 3: ReDoS 修正
- [ ] 初期スコア計測 (人手必要)
- [ ] Network タブで重いリクエスト確認 (人手必要)
- [ ] VRT の動かし方確認 (人手必要)
