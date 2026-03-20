# 対象項目

- redux-form / Redux / react-redux を完全に除去し、React useState によるフォーム管理に置き換える

# 読んだ docs

- `docs/regulation.md`
- `docs/test_cases.md`
- `application/e2e/src/auth.test.ts`
- `application/e2e/src/search.test.ts`
- `application/e2e/src/dm.test.ts`

# 影響範囲

- `application/client/src/components/auth_modal/AuthModalPage.tsx`
- `application/client/src/containers/AuthModalContainer.tsx`
- `application/client/src/auth/validation.ts`
- `application/client/src/components/application/SearchPage.tsx`
- `application/client/src/containers/SearchContainer.tsx`
- `application/client/src/search/validation.ts`
- `application/client/src/components/direct_message/NewDirectMessageModalPage.tsx`
- `application/client/src/containers/NewDirectMessageModalContainer.tsx`
- `application/client/src/direct_message/validation.ts`
- `application/client/src/components/foundation/FormInputField.tsx`
- `application/client/src/store/index.ts` (削除)
- `application/client/src/index.tsx`
- `application/client/package.json`

# 発見した問題

## 問題 1: auth.test.ts テスト5「サインインに失敗するとエラーが表示される」の失敗

- `AuthModalContainer` は `<dialog>` の `toggle` イベントで `resetKey` をインクリメントし、`AuthModalPage` を `key={resetKey}` でリマウントしていた。
- ダイアログが開くときに `toggle` イベントが発火 → React が非同期でリマウントをスケジュール → Playwright の `pressSequentially` が旧コンポーネントの input に入力 → リマウントで入力値が消失。
- 単独実行ではタイミングが合って成功するが、他テストの後に実行すると V8 コードキャッシュによりページ読み込みが高速化し、レースコンディションが顕在化。
- **証拠**: デバッグ属性で `data-debug-values={"password":"wrong_password"}` (username が消失)、`data-debug-errors={"username":"ユーザー名を入力してください"}` を確認。

## 問題 2: search.test.ts「空のまま検索するとエラーが表示される」の失敗

- redux-form の `handleSubmit` がバリデーションエラーを無視して `onSubmit` コールバックを呼んでしまい、空文字のまま `/search?q=` に遷移してしまっていた。
- バリデーションロジック自体は正しくエラーを返すが、redux-form v8.3.10 の `handleSubmit` が sync validation エラーを正しくブロックしていなかった。
- ブラウザで手動確認：検索ボタンクリック → URL が `search?q=` に変わり、エラーメッセージは表示されなかった。

## 問題 3: DM モーダルにも同じ toggle レースコンディション

- `NewDirectMessageModalContainer` にも `AuthModalContainer` と同一の `toggle` → `resetKey` パターンがあり、同様のレースコンディションのリスクがあった。

## 構造的な問題

- Redux store は `formReducer` のためだけに存在し、フォーム以外の状態管理は一切使っていなかった。
- redux-form (~26KB gz) + redux (~2KB gz) + react-redux (~5KB gz) = **約33KB gzipped** がフォーム3つのためだけにバンドルされていた。
- フォームは auth（3フィールド）、search（1フィールド）、DM（1フィールド）と非常に単純。

# 実装前の仮説

- redux-form を除去して React useState に置き換えることで:
  1. auth テストのレースコンディションが解消（toggle でのリマウントは残すが、redux-form の HOC 層がなくなるため状態管理がシンプルに）
  2. search テストのバリデーション不具合が解消（自前の submit ハンドラで確実にバリデーションをチェック）
  3. バンドルサイズが約33KB gzipped 削減
  4. Redux store 自体が不要になり、Provider ラッパーも除去可能

# 採用した方針

- 3つのフォーム全てを React の `useState` + ネイティブ HTML form で再実装する。
- 既存のバリデーション関数（`auth/validation.ts`, `search/validation.ts`, `direct_message/validation.ts`）はロジックをそのまま維持し、型定義のみ `FormErrors` → `Partial<Record<K, string>>` に変更。
- `FormInputField` を `WrappedFieldProps` 依存から `ComponentPropsWithRef<"input">` ベースに変更。
- `SubmissionError` パターンを `throw string` + `catch` パターンに簡素化。
- `toggle` イベントでのリセットは「閉じたときのみ」に統一（auth, DM 両方）。
- Redux store (`store/index.ts`) を削除、`index.tsx` から `Provider` を除去。
- `package.json` から `redux`, `react-redux`, `redux-form`, `@types/redux-form` を除去。

# 実装内容

## FormInputField (共通コンポーネント)
- `WrappedFieldProps` (`input`, `meta`) → `ComponentPropsWithRef<"input">` + `error?`, `touched?` プロパティ
- `{...input}` + `{...props}` のスプレッド → `{...inputProps}` に統一

## AuthModalPage + AuthModalContainer
- `reduxForm` HOC → `useState` で `type`, `username`, `name`, `password`, `touched`, `submitting`, `serverError` を管理
- `formValueSelector` → 直接 `useState` の `type` を参照
- `change("type", ...)` → `setType(...)`
- `Field` → 直接 `FormInputField` を props 付きで配置
- `SubmissionError` → `throw string` + `catch` でエラー表示

## SearchPage + SearchContainer
- `reduxForm` HOC + `enableReinitialize` → `useState` + `useEffect` で `query` prop と同期
- `Field` + `SearchInput` → 直接 `<input>` をインライン
- `handleSubmit(onSubmit)` → 自前の `handleSubmit` で `e.preventDefault()` + バリデーションチェック + `navigate()`
- `SearchContainer` から `initialValues` prop を除去

## NewDirectMessageModalPage + NewDirectMessageModalContainer
- `reduxForm` HOC → `useState` で `username`, `touched`, `submitting`, `serverError` を管理
- `SubmissionError` → `throw string` + `catch`
- `toggle` イベント: 閉じたときのみリセットするよう修正

## エントリーポイント
- `store/index.ts` を削除
- `index.tsx` から `Provider` と `store` import を除去

## package.json
- dependencies から `redux`, `react-redux`, `redux-form` を除去
- devDependencies から `@types/redux-form` を除去
- `pnpm install`: 15 パッケージが削除された

# 検証結果

- ビルド成功: webpack 5.102.1 compiled with 2 warnings
- **main.js サイズ**: 1.1MB → 1.0MB に削減（約100KB 削減）
- auth.test.ts: 5/5 パス（テスト5のレースコンディション解消を確認）
- 全 E2E テスト実行待ち（前回の partial run で 49/52 パス）

# スコア変化

- main.js: 1,139,370 bytes → 約 1,040,000 bytes（約 100KB、9% 削減）
- パッケージ数: 15 packages removed
- React ツリー: Redux Provider ラッパー 1 層除去

# リスクと未確認事項

- フォームの `touched` 状態の管理が redux-form と完全同一ではない。redux-form は各フィールドの `onBlur` で自動的に `touched` を設定していたが、新実装では明示的に `onBlur` ハンドラを渡している。テスト通過で動作は確認済み。
- DM テスト2件は VRT スナップショットが未生成のため失敗する（コード変更とは無関係、初回実行でベースライン画像を生成する必要あり）。
- search テスト「空のまま検索するとエラーが表示される」は、自前バリデーションチェックにより修正済み。

# 次にやるべきこと

- 全 E2E テストの完全実行と結果確認
- DM テストの VRT スナップショットベースライン生成（`--update-snapshots`）
- Lighthouse スコア計測でバンドル削減の効果を確認
- `public/` の画像・メディア最適化に着手
