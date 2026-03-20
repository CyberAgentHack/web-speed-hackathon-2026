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
- main.js: **107.8 MB → 12 MiB** に削減

### Phase 3: 遅延除去・ReDoS 修正

- [x] `crok.ts`: `sleep(3000)` + `sleep(10)` × 文字数 を削除 (`b2761b2`)
- [x] `DirectMessagePage.tsx`: `setInterval(..., 1)` → `useEffect` + `scrollTo` に置換 (`b2761b2`)
- [x] `AspectRatioBox.tsx`: `setTimeout(calcStyle, 500)` → `ResizeObserver` に置換 (`b2761b2`)
- [x] ReDoS: `validation.ts`・`services.ts` の 4 箇所を修正 (`1d7d824`)

---

## 未対応 (優先順)

- [ ] **Phase 2**: `@mlc-ai/web-llm` → サーバー側翻訳 API に移行 (~13 MB 削減見込み)
- [ ] **Phase 4**: 動画を GIF → WebM/MP4 に変換して配信
- [ ] **Phase 4**: 画像を AVIF/WebP + リサイズして配信
- [ ] **Phase 4**: 音声を MP3 → Opus に変換して配信
- [ ] **Phase 5**: API レスポンスのキャッシュ・gzip 圧縮・N+1 改善
- [ ] デプロイ後スコア再計測 (運営インフラ修正待ち)
