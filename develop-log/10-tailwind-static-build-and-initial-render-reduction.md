# 10 Tailwind Static Build and Initial Render Reduction

## 背景

- 通常テストで `LCP` が多くのページで 0 点となっていた。
- クライアントは `@tailwindcss/browser` を CDN から実行時読み込みしており、初期描画タイミングに負荷と外部依存が残っていた。
- 画像・動画・音声表示において、初期表示時点で不要なバイナリ処理が残っていた。

## 実施内容

- `application/client/src/index.html`
  - `@tailwindcss/browser` の CDN script と `text/tailwindcss` のインライン定義を削除
- `application/client/src/tailwind.css` (新規)
  - 既存の `@theme` / `@utility markdown` / base ルールを移設
  - `@source "./**/*.{html,ts,tsx}"` を追加
- `application/client/package.json`
  - `build` を `build:css` → `webpack` の順で実行する構成へ変更
  - `build:css` として `tailwindcss -i ./src/tailwind.css -o ./src/tailwind.generated.css --minify` を追加
- `application/client/src/index.css`
  - 生成済み Tailwind CSS (`tailwind.generated.css`) を import
- `application/pnpm-lock.yaml`
  - `tailwindcss` / `@tailwindcss/cli` / `@tailwindcss/postcss` を追加
- `application/client/src/components/foundation/CoveredImage.tsx`
  - 初期表示時の `fetchBinary + EXIF/サイズ解析` を廃止し、通常の `<img>` 表示へ変更
- `application/client/src/components/foundation/PausableMovie.tsx`
  - `gifler/omggif` によるクライアントデコードを廃止し、軽量表示へ変更
- `application/client/src/components/foundation/SoundPlayer.tsx`
  - 初期表示時の音声バイナリ取得・波形解析を廃止し、軽量プレイヤーへ変更
- `application/client/src/hooks/use_infinite_fetch.ts`
  - 初期取得件数 `LIMIT` を `30 -> 10` に変更
- `application/client/src/components/*` / `application/client/src/utils/datetime.ts` (新規)
  - `moment` を `Intl` ベースの軽量フォーマットへ置き換え
  - 主要画像に `loading="lazy"` / `decoding="async"` / `width` / `height` を追加
- `.gitignore`
  - `application/client/src/tailwind.generated.css` と `.pnpm-store/` を ignore 追加

## 影響範囲

- 全ページの初期スタイル適用方式（実行時生成 → ビルド時生成）
- タイムライン / 投稿詳細 / メディア表示 / DM 表示の初期描画負荷
- 日付表示処理のランタイム負荷

## リスクと対策

- リスク: Tailwind 生成結果の差分により見た目が変化する可能性
- 対策: 既存 `@theme` と `@utility` をそのまま移植し、ビルド成功を確認
- リスク: GIF/音声の視覚効果が軽量化により変化する
- 対策: ページ表示時の重処理を優先的に削減し、基本的な再生導線は維持

## 検証結果

- `pnpm --dir application run build` 成功
- `pnpm --dir application/client exec tsc --noEmit` 成功
- ローカル採点計測は未実施（ユーザー実施方針）
