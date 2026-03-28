# 09 Initial Bundle Splitting and Lazy Loading

## 背景

- 通常テストで `FCP / LCP / SI / TBT` が 0 点となり、ページ表示スコアが伸びない状態だった。
- クライアントのエントリバンドル `scripts/main.js` が 71.8 MiB と非常に大きく、初期表示時に不要な重依存（翻訳・変換・形態素解析）が同梱されていた。

## 実施内容

- `application/client/webpack.config.js`
  - `output.chunkFormat: false` を削除し、動的 import の分割チャンクを有効化
- `application/client/src/containers/AppContainer.tsx`
  - ルートコンテナを `React.lazy` + `Suspense` へ変更し、画面単位でコード分割
  - `activeUser` 取得完了まで全体レンダリングを止める処理を廃止し、初期描画を即時化
  - `NewPostModalContainer` を lazy 化し、未ログイン時は読み込まないよう変更
- `application/client/src/components/post/TranslatableText.tsx`
  - 翻訳機能 (`create_translator` / `@mlc-ai/web-llm`) をクリック時の動的 import に変更
- `application/client/src/components/application/SearchPage.tsx`
  - ネガポジ判定 (`negaposi_analyzer`) を検索判定時の動的 import に変更
- `application/client/src/components/new_post_modal/NewPostModalPage.tsx`
  - 画像・動画・音声変換モジュール（ImageMagick / FFmpeg / encoding）をファイル選択時の動的 import に変更

## 影響範囲

- 初回表示時の JS 読み込み・評価コスト
- 画面遷移時のチャンク読み込み挙動
- 翻訳、検索ネガポジ判定、投稿時メディア変換の初回実行タイミング

## リスクと対策

- リスク: 初回の翻訳実行・メディア変換・ネガポジ判定時にチャンク読み込み遅延が発生する
- 対策: 既存のローディング表示を維持し、初回表示性能を優先する構成に変更
- リスク: ルート lazy 化により遷移直後に一瞬フォールバックが表示される
- 対策: `Suspense` のフォールバックを簡易表示（`読込中...`）に統一

## 検証結果

- `pnpm --dir application run build` 成功
- ビルド出力確認
  - 変更前: `scripts/main.js` 71.8 MiB
  - 変更後: エントリ `main` 387 KiB（`scripts/main.js` 381 KiB + `styles/main.css` 6.69 KiB）
- ローカル採点計測は未実施（途中中断）
