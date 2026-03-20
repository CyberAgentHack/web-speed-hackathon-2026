# WSH 2026 対応状況

発見した問題の対応状況と残 TODO を管理する。発見内容の詳細は [`findings.md`](./findings.md) を参照。現在のコードと [`checklist.md`](../checklist.md) を参考に、随時項目を追加・更新していくこと。

チェックが付いているものは対応済み。上から優先順。

---

- [x] `webpack.config.js`: `mode: "none"` → `mode: "production"`、`devtool` 削除 (`f29812b`)
- [x] `client/package.json` build script: `NODE_ENV=development webpack` → `webpack` (`43e0877`)
- [x] `Dockerfile` build ステージ: `ENV NODE_ENV=production` を追加 (`aaffb61`)
- [x] `index.html`: `<script defer>` を追加 (`b8c2c00`)
- [x] Babel 設定改善 (`e72313b`)
- [x] `@ffmpeg/core` + `@ffmpeg/ffmpeg` WASM → サーバー側 ffmpeg に移行 (`fa6ed03`)
- [x] `@imagemagick/magick-wasm` WASM → サーバー側 sharp に移行 (`6eb432f`)
- [x] `@mlc-ai/web-llm` → `POST /api/v1/translate` (MyMemory プロキシ) に移行、`langs`/`common-tags`/`json-repair-js`/`tiny-invariant`/`encoding-japanese` も削除
- [x] デッドコード `extract_metadata_from_sound.ts` を削除
- [x] `negaposi-analyzer-ja` + `kuromoji` + `bayesian-bm25` → サーバー側 `POST /api/v1/sentiment` + `GET /api/v1/crok/suggestions/search` に移行 (名詞ハイライト要件は `queryTokens` をレスポンスに含めて維持)
- [x] `react-syntax-highlighter` → `React.lazy` + `Suspense` で遅延分離。`CrokContainer.sendMessage` 時に prefetch 開始 (full ビルドのまま — Light ビルドは自動言語検出結果が変わり挙動変更禁止に抵触するため)
- [x] main.js: **107.8 MB → ~12 MiB → ~896 KiB → ~346 KiB** に削減 (Phase 4 ② 後)
- [x] `DirectMessagePage.tsx`: `setInterval(..., 1)` → `useEffect` + `scrollTo` に置換 (`b2761b2`)
- [x] `AspectRatioBox.tsx`: `setTimeout(calcStyle, 500)` → `ResizeObserver` に置換 (`b2761b2`)
- [x] ReDoS: `validation.ts`・`services.ts` の 4 箇所を修正 (`1d7d824`)
- [x] `standardized-audio-context` (466 KB) を除去 — `webpack.config.js` の `ProvidePlugin` から削除
- [x] `fetchers.ts` を `fetch` に置き換え → `jquery` + `jquery-binarytransport` + `pako` + 同期 XHR (TBT) を除去
- [x] `InfiniteScroll.tsx`: 2^18 ループ → `IntersectionObserver` に置換
- [x] `use_infinite_fetch.ts`: `allData` キャッシュで毎回全件 re-fetch を排除
- [x] `lodash` (544 KB) → ネイティブ JS に置き換え (`SoundWaveSVG.tsx`)
- [x] `moment` (176 KB) → `dayjs` に置き換え (6 ファイル。plugin 設定は `index.tsx` で一括登録)
- [x] `crok.ts`: `sleep(3000)` / `sleep(10)` は仕様として**維持** (除去禁止)
- [x] **Phase 4 ①** GIF → WebM (VP9) 変換 + `PausableMovie.tsx` を native `<video>` 化
  - `public/movies/*.gif` (15 本・180 MB) を ffmpeg VP9 で変換 → **43 MB** (76% 削減)
  - `server/src/routes/api/movie.ts`: `EXTENSION = "webm"`、ffmpeg を VP8 出力に変更
  - `get_path.ts`: `getMoviePath` の拡張子 `.gif` → `.webm`
  - `PausableMovie.tsx`: `gifler` + canvas → native `<video autoplay loop muted playsInline>` に書き換え
    - `gifler` / `omggif` / `bluebird` がバンドルから消える
    - `aria-label="動画プレイヤー"` の button は維持 (E2E テスト要件)
    - `prefers-reduced-motion` 対応維持
- [x] **Phase 4 ②** `AppContainer.tsx` のルートレベル `React.lazy()` + `<Suspense>` 化
  - Route コンテナ 9 個を `lazy()` に変更 (AuthModal・NewPostModal は常時 DOM なので静的のまま)
  - main.js: **896 KiB → 346 KiB** (61% 削減)
- [x] **Phase 4 ③** MP3 → Opus 変換 (WebM コンテナではなく `.opus` = Ogg/Opus)
  - `public/sounds/*.mp3` (15 本・67 MB) を ffmpeg Opus で変換 → **約 27 MB** (60% 削減)
  - `server/src/routes/api/sound.ts`: `EXTENSION = "opus"`、ffmpeg に `-c:a libopus -b:a 96k` 追加
  - `get_path.ts`: `getSoundPath` の拡張子 `.mp3` → `.opus`
  - `SoundWaveSVG.tsx`: `AudioContext.decodeAudioData` はフォーマット非依存 → 変更不要
- [ ] **Phase 4 ④** JPEG 圧縮最適化 ← **次にやること**
  - `public/images/*.jpg` を sharp で quality 75 に再圧縮 (WebP/AVIF は `piexifjs` が JPEG-only のため非推奨)
  - `server/src/routes/api/image.ts` で quality パラメータ追加
- [ ] **Phase 5** gzip 圧縮・N+1 改善 (キャッシュは採点ツールが毎回 cold start で実行するため WSH スコアに効果なし → 対象外)
