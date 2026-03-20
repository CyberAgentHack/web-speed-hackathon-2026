# 対象項目

- `window.addEventListener("load", ...)` をやめ、React mount を `DOMContentLoaded` 基準に前倒しする

# 読んだ docs

- `README.md`
- `web-speed-hackathon-2026/docs/regulation.md`
- `web-speed-hackathon-2026/docs/scoring.md`
- `web-speed-hackathon-2026/docs/test_cases.md`
- `web-speed-hackathon-2026/application/README.md`

# 影響範囲

- `application/client/src/index.tsx`
- `application/client/src/index.html`
- `application/e2e/src/home.test.ts`
- `application/e2e/src/dm.test.ts`

# 実装前の仮説

- `load` 待ちのため、SPA の mount と初回データ取得開始が不要に遅れている。
- 表示内容そのものは変えないため、レギュレーション上のリスクは低い。
- ただし起動が早くなると、ホームの動画 readyState や一部 E2E の待ち順に影響する可能性がある。

# 採用した方針

- `load` は使わず、`document.readyState` を見て `DOMContentLoaded` か即時 mount にする。
- hydration や SSR は無いため、`index.tsx` だけの最小変更に留める。
- VRT 全件で副作用を確認する。

# 実装内容

- `application/client/src/index.tsx`
  - `mount()` を切り出し
  - `document.readyState === "loading"` の場合のみ `DOMContentLoaded` を 1 回だけ待つ
  - それ以外は即時 mount

# 検証結果

- `pnpm --dir application run build`: 成功
- `E2E_WORKERS=1 pnpm --dir application --filter @web-speed-hackathon-2026/e2e run test`: `52 passed`
- `pnpm --dir application run analyze:lighthouse:mobile -- --url http://127.0.0.1:3000/`: 成功

# スコア変化

- 比較元: 変更前に repo に存在した `application/reports/lighthouse/home.mobile.report.json`
- Lighthouse mobile
  - score: `0.42` -> `0.44`
  - FCP: `1.1s` -> `0.8s`
  - LCP: `166.6s` -> `150.5s`
  - Speed Index: `4.7s` -> `3.2s`
  - TBT: `16,910ms` -> `19,960ms`
  - total bytes: `58,638 KiB` -> `51,557 KiB`

# リスクと未確認事項

- 比較元 Lighthouse artifact は手元の直前計測ではなく既存レポートなので、厳密な同条件比較ではない。
- TBT は改善せず、むしろやや悪化している。
- Node `24.14.0` 想定の repo だが、今回の検証環境は Node `22.18.0` だった。

# 次にやるべきこと

- TBT の悪化要因が mount 前倒しによるものか、計測ぶれかを追加計測で確認する。
- 初回表示の main-thread work を削る別改善と組み合わせて再計測する。
