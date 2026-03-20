# Next Five Item Report: Fetchers to Fetch

## 1. 対象項目

`application/client/src/utils/fetchers.ts` の jQuery AJAX 依存を `fetch` ベースへ寄せ、main chunk から `jquery` / `jquery-binarytransport` を剥がす。

## 2. 読んだ docs

- `README.md`
- `docs/regulation.md`
- `docs/scoring.md`
- `docs/test_cases.md`
- `application/README.md`

## 3. 影響範囲

- `application/client/src/utils/fetchers.ts`
- `application/client/src/containers/AuthModalContainer.tsx`
- `application/client/src/containers/AppContainer.tsx`
- `application/client/src/containers/DirectMessageContainer.tsx`
- `application/client/src/containers/NewDirectMessageModalContainer.tsx`
- `application/client/src/containers/NewPostModalContainer.tsx`
- `application/client/src/components/crok/ChatInput.tsx`
- `application/client/rspack.config.js`

`rg` で確認した利用入口は `fetchJSON`, `sendJSON`, `sendFile` に集約されていた。  
加えて `rspack.config.js` の `entry.main` に `jquery-binarytransport` が直書きされており、`fetchers.ts` を差し替えても main chunk に残り続けることを bundle stats で確認した。

## 4. 実装前の仮説

- `fetchers.ts` の import を消すだけでは不十分で、bundler 側の強制注入も外す必要がある
- auth / DM / 投稿の API 境界は `fetchers.ts` にまとまっているため、エラー互換を維持できれば段階移行できる
- main.js から `jquery` 約 278.6 KiB と `jquery-binarytransport` を落とせれば TBT / parse cost 改善が見込める

## 5. 採用した方針

安全優先案を採用した。

- `fetchers.ts` の公開 API は維持
- `fetch` ラッパーと `HttpError` を導入して jQuery 依存だけ除去
- auth のエラー解釈だけ `HttpError.responseJSON` に合わせて置換
- その上で `rspack.config.js` の `jquery-binarytransport` entry と jQuery `ProvidePlugin` 注入を削除

## 6. 実装内容

- `fetchers.ts`
  - `$.ajax` を廃止
  - JSON / ArrayBuffer 用の共通 `request()` を追加
  - gzip 送信は継続
  - `HttpError` を export
- `AuthModalContainer.tsx`
  - `JQuery.jqXHR` 依存を `HttpError` へ置換
- `rspack.config.js`
  - `entry.main` から `jquery-binarytransport` を削除
  - `ProvidePlugin` の `$` / `window.jQuery` 注入を削除

## 7. 検証結果

- `pnpm --filter @web-speed-hackathon-2026/client run typecheck`: 成功
- `pnpm run build`: 成功
- `pnpm --filter @web-speed-hackathon-2026/client run analyze`: 成功
- `pnpm exec playwright test src/dm.test.ts -g '送信ボタンをクリックすると、DM詳細画面に遷移すること'`: 成功
- `pnpm exec playwright test src/home.test.ts src/user-profile.test.ts`: 成功
- `pnpm exec playwright test src/auth.test.ts src/dm.test.ts src/home.test.ts src/posting.test.ts src/search.test.ts src/user-profile.test.ts`: 初回実行では `DM詳細遷移`, `ホーム動画`, `user-profile VRT` が失敗したが、`DM詳細遷移` と `home/user-profile` の再実行では再現しなかった

補足:

- Node からの直接 API 検証で `signin -> /api/v1/dm` は平文 JSON / gzip JSON の両方で 200 を確認した

## 8. スコア変化

`application/reports/webpack-stats.json` の再生成結果では、`jquery` / `jquery-binarytransport` モジュールが main chunk から消えた。  
`scripts/main.js` は約 `421.8 KiB` から約 `336.6 KiB` まで減少した。

## 9. リスクと未確認事項

- Lighthouse の再計測は未実施
- E2E は一部揺れがあり、フルサブセット初回では 3 件失敗した
- `application/client/package.json` から依存宣言自体はまだ除去していない

## 10. 次にやるべきこと

- `home.mobile/desktop` の Lighthouse を再計測して `unused-javascript` と TBT の変化を確認する
- 依存宣言の後片付けをするなら、既存の lockfile / 他変更と干渉しないタイミングで `jquery`, `jquery-binarytransport`, `@types/jquery` の除去を検討する
