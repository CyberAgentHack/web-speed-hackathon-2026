# WSH 2026 対応状況

発見した問題の対応状況と残 TODO を管理する。発見内容の詳細は [`findings.md`](./findings.md) を参照。

---

## 対応済み

### Phase 1: ビルド設定修正

- [x] `webpack.config.js`: `mode: "none"` → `mode: "production"`、`devtool` 削除 (`f29812b`)
- [x] `client/package.json` build script: `NODE_ENV=development webpack` → `webpack` (`43e0877`)
- [x] `Dockerfile` build ステージ: `ENV NODE_ENV=production` を追加 (`aaffb61`)
- [x] `index.html`: `<script defer>` を追加 (`b8c2c00`)
- [x] Babel 設定改善 (`e72313b`)

### Phase 2: バンドルサイズ削減

- [x] `@ffmpeg/core` + `@ffmpeg/ffmpeg` WASM → サーバー側 ffmpeg に移行 (`fa6ed03`)
- [x] `@imagemagick/magick-wasm` WASM → サーバー側 sharp に移行 (`6eb432f`)
- [x] `@mlc-ai/web-llm` → `POST /api/v1/translate` (MyMemory プロキシ) に移行、`langs`/`common-tags`/`json-repair-js`/`tiny-invariant`/`encoding-japanese` も削除
- [x] デッドコード `extract_metadata_from_sound.ts` を削除
- [x] `negaposi-analyzer-ja` + `kuromoji` + `bayesian-bm25` + `bluebird` → サーバー側 `POST /api/v1/sentiment` + `GET /api/v1/crok/suggestions/search` に移行
  - サジェスト候補のハイライトは `queryTokens` をレスポンスに含めてクライアントに渡す形で対応 (名詞ハイライト要件を維持)
- [x] `react-syntax-highlighter` → `ChatMessage` で `React.lazy` + `Suspense` に変更、highlight.js チャンクを main.js から分離
  - メッセージ送信時 (`CrokContainer.sendMessage`) に `import()` で prefetch 開始、コードブロック描画までの sleep 時間内にロード完了する設計
  - **light ビルド + 言語絞り込みを採用しなかった理由**: `Light` ビルドの自動検出は登録済み言語の中からしか選ばないため、全言語入りビルドと自動検出結果が変わりシンタックスハイライトの色付きが変化する。挙動変更禁止のため full ビルドのまま遅延ロードで対応
- main.js: **107.8 MB → ~12 MiB** に削減 (highlight.js 遅延分離で更に削減)

### Phase 3: 遅延除去・ReDoS 修正

- `crok.ts`: `sleep(3000)` / `sleep(10)` は仕様として維持 (除去対象外)
- [x] `DirectMessagePage.tsx`: `setInterval(..., 1)` → `useEffect` + `scrollTo` に置換 (`b2761b2`)
- [x] `AspectRatioBox.tsx`: `setTimeout(calcStyle, 500)` → `ResizeObserver` に置換 (`b2761b2`)
- [x] ReDoS: `validation.ts`・`services.ts` の 4 箇所を修正 (`1d7d824`)

---

## 未対応 (優先順)

- [x] **Phase 2**: `standardized-audio-context` (466 KB) を除去 — `webpack.config.js` の `ProvidePlugin` から削除 (`AudioContext` はネイティブ実装済み)
- [ ] **Phase 2**: `fetchers.ts` を `fetch` に置き換え → `jquery` (285 KB) + `jquery-binarytransport` + 同期 XHR (TBT) を除去。`sendJSON` の gzip 圧縮はサーバー対応を先に確認
- [ ] **Phase 2**: `lodash` (544 KB) → ネイティブ JS に置き換え (`SoundWaveSVG.tsx` 等)
- [ ] **Phase 2**: `moment` (176 KB) → `day.js` に置き換え
- [ ] **Phase 4**: 動画を GIF → WebM/MP4 に変換して配信
- [ ] **Phase 4**: 画像を AVIF/WebP + リサイズして配信
- [ ] **Phase 4**: 音声を MP3 → Opus に変換して配信
- [ ] **Phase 5**: API レスポンスのキャッシュ・gzip 圧縮・N+1 改善
- [ ] デプロイ後スコア再計測 (運営インフラ修正待ち)
