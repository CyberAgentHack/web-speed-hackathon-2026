# Next Five Item Report: Font Awesome Inline

## 1. 対象項目

Font Awesome の巨大スプライト参照をやめて、実際に使っている glyph だけをクライアントに同梱する。

## 2. 読んだ docs

- `README.md`
- `docs/regulation.md`
- `docs/scoring.md`
- `docs/test_cases.md`
- `application/README.md`

## 3. 影響範囲

- `application/client/src/components/foundation/FontAwesomeIcon.tsx`
- `application/client/src/components/application/Navigation.tsx`
- `application/client/src/components/direct_message/*`
- `application/client/src/components/crok/*`
- `application/client/src/components/new_post_modal/*`
- `application/client/src/components/foundation/*`
- `application/client/src/components/user_profile/UserProfileHeader.tsx`

`rg` で `FontAwesomeIcon` の全使用箇所を確認し、実使用 icon は `solid` 17 個、`regular` 1 個に限定されていた。

## 4. 実装前の仮説

- `home.desktop/mobile` で観測されている `/sprites/font-awesome/solid.svg` 約 654 KB の追加リクエストを落とせる
- ホーム、検索、投稿、DM、Crok など複数画面で初回描画が安定する
- 既存スプライトと同一 path を使えば VRT 差分は最小化できる

## 5. 採用した方針

安全優先案を採用した。

- 既存の Font Awesome スプライトから実使用 icon の `viewBox` と `path` を抽出
- `FontAwesomeIcon` コンポーネントの API は維持
- 参照先だけ `<use>` からインライン `<path>` に置換
- 他の UI コンポーネントは変更しない

## 6. 実装内容

- `FontAwesomeIcon.tsx` に実使用 icon のみを `Record` として内包
- `<use xlinkHref="/sprites/font-awesome/...">` を廃止
- 既存の `font-awesome` CSS class、`iconType` / `styleType` API、色指定は維持

## 7. 検証結果

- `pnpm run build`: 成功
- `pnpm --filter @web-speed-hackathon-2026/client run typecheck`: 成功
- `pnpm exec playwright test src/crok-chat.test.ts src/dm.test.ts src/home.test.ts src/post-detail.test.ts src/posting.test.ts src/responsive.test.ts src/search.test.ts src/terms.test.ts src/user-profile.test.ts`: VRT を含む 47 件の対象テストで差分失敗なし

補足:

- Playwright の親プロセスが終了待ちで残ったため後続で停止したが、可視化されたテスト結果上は失敗なし
- ユーザー指定の `12` は今回の実行でも通過していた

## 8. スコア変化

再計測は未実施。

ただし build 後の `application/dist/scripts/main.js` から `/sprites/font-awesome/solid.svg` / `regular.svg` 参照が消えていることを確認した。

## 9. リスクと未確認事項

- Lighthouse の再計測は未実施
- `brands.svg` は現時点で参照がないが、将来追加された場合は同じ方式で管理が必要

## 10. 次にやるべきこと

- Lighthouse でホームの `network-requests` を再計測して、スプライト除去の効果を数値で確認する
- 続けて `fetchers.ts` の jQuery 依存除去を進め、main chunk の JavaScript 削減を狙う
