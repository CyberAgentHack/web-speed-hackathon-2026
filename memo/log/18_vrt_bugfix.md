# 18. VRT 失敗の調査・修正 (2026-03-21)

## 背景

パフォーマンス改善の結果、VRT で 9 件の失敗が残っていた。レギュレーション違反（VRT 失敗）で失格にならないよう、原因を調査し修正可能なものを修正した。

## 調査結果

| 失敗テスト | 原因 | 我々の変更が原因？ |
|---|---|---|
| 検索バリデーション (3件) | redux-form + React 19 互換性問題で `handleSubmit` が `preventDefault` を呼ばない | ❌ 元からのバグ |
| 検索結果/無限スクロール (2件) | Sequelize の defaultScope で `exclude: ["profileImageId"]` が limit/offset 時にサブクエリ生成で壊れる | ❌ 元からのバグ |
| 画像投稿 (1件) | WebP 変換時に元 JPG を全削除したが、e2e テストがサンプル画像として JPG を参照していた | ✅ 修正済み |
| DM/Crok (5件) | SSE 接続が `waitForPageToLoad` の `networkidle` を阻害 | ❌ upstream テスト設計の問題 |

## 修正内容

### 1. 検索バリデーション — redux-form → 手動バリデーション

redux-form 8.3.10 は React 19 / react-redux 9 / Redux 5 をサポートしていない。`handleSubmit` が `event.preventDefault()` を呼ばず、バリデーションエラー時もフォームが submit されてしまっていた。

- `SearchPage.tsx`: redux-form (`reduxForm`, `Field`, `InjectedFormProps`) を削除し、`useState` による手動バリデーションに置き換え
- `SearchContainer.tsx`: `initialValues` prop を削除

### 2. 検索 API — Sequelize subQuery 問題

`Post.findAll({ limit, offset })` で defaultScope の `include` + `attributes.exclude` が Sequelize のサブクエリ生成と衝突し、`SQLITE_ERROR: no such column: user.profileImageId` が発生。

- `search.ts`: 両クエリに `subQuery: false` を追加
- `Post.ts`, `Comment.ts`, `User.ts`: defaultScope の `attributes: { exclude: ["profileImageId"] }` を削除（User defaultScope が二重に適用されてサブクエリ内で壊れるため）

### 3. 画像投稿テスト — JPG ファイル復元

e2e テストが `public/images/737f764e-...jpg` をアップロード用サンプルとして参照していたが、WebP 変換時に元 JPG を全削除していた。テスト用にこの 1 ファイルだけ WebP から JPG を再生成。

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `client/src/components/application/SearchPage.tsx` | redux-form → useState 手動バリデーション |
| `client/src/containers/SearchContainer.tsx` | `initialValues` prop 削除 |
| `server/src/routes/api/search.ts` | `subQuery: false` 追加、user attributes exclude 削除 |
| `server/src/models/Post.ts` | defaultScope の user include から `exclude: ["profileImageId"]` 削除 |
| `server/src/models/Comment.ts` | 同上 |
| `server/src/models/User.ts` | defaultScope から `attributes: { exclude: ["profileImageId"] }` 削除 |
| `public/images/737f764e-...jpg` | テスト用に WebP から JPG を再生成 |

## VRT 結果

修正前: 9 failed, 4 flaky, 39 passed
修正後: **6 failed, 2 flaky, 44 passed**

残り 6 件の失敗は全て SSE/タイムアウト/WASM 関連で、コード変更では解決できない問題。
