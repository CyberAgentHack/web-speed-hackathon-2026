# 対象項目

- 一覧初期表示から重い機能依存を外し、遅延 import に寄せる

# 読んだ docs

- `README.md`
- `docs/regulation.md`
- `docs/scoring.md`
- `docs/test_cases.md`
- `docs/development.md`
- `scoring-tool/README.md`

# 影響範囲

- `application/client/src/containers/AppContainer.tsx`
- `application/client/src/containers/NewPostModalContainer.tsx`
- `application/client/src/components/new_post_modal/NewPostModalPage.tsx`
- `application/client/src/utils/create_translator.ts`
- `application/client/src/components/crok/ChatInput.tsx`
- `application/client/webpack.config.js`

# 実装前の仮説

- `ffmpeg` / `ImageMagick wasm` / `web-llm` / `kuromoji` / BM25 検索がホーム初期表示と同じ main chunk に入っていた。
- 投稿一覧に不要な機能を route-level と action-level で分離すれば、初期 JS を大きく削れる。
- async chunk が出ない場合は webpack 側の chunk 出力設定も見直しが必要。

# 採用した方針

- ルート単位で `React.lazy` と `Suspense` を導入する。
- 投稿モーダル、翻訳、Crok サジェストの重い依存を操作時 import に移す。
- その上で webpack の async chunk 出力を有効にする。
- 404 は E2E の入口なので eager import のまま維持する。

# 実装内容

- `application/client/src/containers/AppContainer.tsx`
  - `Crok` / `DM` / `検索` / `投稿詳細` / `利用規約` / `ユーザープロフィール` を route-level lazy import 化
  - `NotFoundContainer` は eager のまま維持
- `application/client/src/containers/NewPostModalContainer.tsx`
  - モーダル本文を初回オープン時まで描画しない
  - `NewPostModalPage` を lazy import 化
- `application/client/src/components/new_post_modal/NewPostModalPage.tsx`
  - `convert_image` / `convert_movie` / `convert_sound` と `@imagemagick/magick-wasm` を操作時 import 化
- `application/client/src/utils/create_translator.ts`
  - `@mlc-ai/web-llm` を `createTranslator()` 実行時 import 化
- `application/client/src/components/crok/ChatInput.tsx`
  - `bluebird`, `kuromoji`, `bm25_search` を遅延 import 化
  - tokenizer 読み込み前でも軽い substring ベースの候補表示が出るようフォールバック追加
- `application/client/webpack.config.js`
  - `output.chunkFormat: false` を外し、async chunk を実際に分割出力できるよう修正

# 検証結果

- `mise x -- just build`: 成功
- `mise x -- just typecheck`: 成功
- `env E2E_WORKERS=1 mise x -- pnpm --dir application --filter @web-speed-hackathon-2026/e2e test src/home.test.ts`: `7 passed`
- `env E2E_WORKERS=1 mise x -- pnpm --dir application --filter @web-speed-hackathon-2026/e2e test src/user-profile.test.ts`: `2 passed`
- `env E2E_WORKERS=1 mise x -- pnpm --dir application --filter @web-speed-hackathon-2026/e2e test src/crok-chat.test.ts`
  - サジェスト表示: pass
  - AI 応答テスト: `login()` 入口で既存不安定を再現
- `mise x -- pnpm --dir application run analyze:lighthouse:mobile -- --url http://127.0.0.1:3000/`: 成功

# スコア変化

- bundle
  - `main.js`: 約 `71.8 MiB` -> 約 `1.09 MiB`
  - 代わりに async chunk として `41 MiB`, `18.6 MiB`, `5.25 MiB`, `4.28 MiB` などへ分離
- Lighthouse mobile
  - score: `0.08` -> `0.02`
  - FCP: `566.8s` -> `14.1s`
  - LCP: `1756.1s` -> `1133.1s`
  - TBT: `25170ms` -> `26590ms`
  - total bytes: `336,734 KiB` -> `227,375 KiB`
  - unused JS: 約 `52,771 KiB` -> 約 `704 KiB`
  - render-blocking savings: 約 `559,180ms` -> 約 `6,472ms`

# リスクと未確認事項

- Lighthouse score 自体は、巨大メディア・CLS・重い main thread work の影響で依然低い。
- Crok の AI 応答テストは今回変更箇所ではなく `login()` 入口で不安定さが残った。
- lazy route で fallback を `null` にしているため、通信が遅い環境では瞬間的に空白が出る可能性がある。

# 次にやるべきこと

- `public/` の画像・動画・音声を安全に圧縮し、network payload をさらに減らす。
- `CoveredImage` 一覧描画の offscreen image 負荷と CLS を下げる。
- `login()` の E2E 不安定は、別件として認証モーダル初期状態を調査する。
