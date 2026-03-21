# 実装計画（application限定）: 投稿詳細系の `NO_FCP` 解消

## 問題
- 以下ページで `NO_FCP` 判定:
  - 投稿詳細
  - 写真つき投稿詳細
  - 動画つき投稿詳細
  - 音声つき投稿詳細
- 採点は Lighthouse ベースのため、初回描画開始の遅延・描画阻害を優先的に除去する。

## 実施済み修正
1. `application/client/src/index.tsx`
   - `window.load` 待ちを削除し、React の初期マウントを即時化。
2. `application/client/src/utils/fetchers.ts`
   - `$.ajax({ async: false })` を全廃。
   - `fetch` + Promise の非同期通信へ置換。
3. `application/client/src/containers/PostContainer.tsx`
   - 投稿詳細の読み込み中に可視テキストを表示するUIを追加。
4. `application/client/src/containers/AppContainer.tsx`
   - アプリ初期読み込み中にも可視テキストを表示。
5. `application/client/src/index.html`
   - Tailwind CDN script を `defer` に変更し、初期ブロックを軽減。

## 検証結果
- `application` のビルドは成功（`pnpm run build`）。
- `async: false` はコードベースから消滅（検索確認済み）。

## 未完了（環境依存）
- Lighthouse / Playwright による最終 `FCP` 実測は未完了。
- 理由: 実行環境にブラウザ依存ライブラリ不足（`libnspr4.so` 等）で Chrome 起動不可。
- 必要対応:
  - `sudo apt-get install libnspr4 libnss3 libasound2t64`（または `playwright install-deps` 相当）
  - その後、投稿詳細4ページの `first-contentful-paint` を再計測。

## 次アクション
1. 依存ライブラリが入る環境で再計測。
2. 4ページすべてで `first-contentful-paint` が `null` でないことを確認。
3. 必要なら追加微調整（初期UIの更なる軽量化）を行う。
