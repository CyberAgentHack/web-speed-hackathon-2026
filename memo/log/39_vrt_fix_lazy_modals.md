# 39. VRT修正: モーダルのlazy化を戻す

## 変更内容

`AppContainer.tsx` で `AuthModalContainer` と `NewPostModalContainer` を `lazy()` + `Suspense` から通常の静的importに戻した。

## 原因

コミット e007ea6 (modals 分割) でモーダルを `lazy()` でコード分割したが、サイドバーの「サインイン」「投稿する」ボタンは HTML Invoker Commands API (`command="show-modal"` / `commandfor`) を使って `<dialog>` を開く仕組み。

`lazy()` + `Suspense fallback={null}` により、初期レンダリング時に `<dialog>` 要素がDOMに存在しないため、ボタンクリック時に `commandfor` のターゲットが見つからずモーダルが開かなかった。

ブラウザでの手動テストではJSチャンクがすぐにロードされるため問題が発生しにくかったが、PlaywrightのE2Eテストではタイミングの問題で17件のテスト(auth 5件, DM 5件, Crok 2件 + retry分)が全て30秒タイムアウトで失敗していた。

## VRT結果

### 修正前
- 34 passed / 17 failed

### 修正後
- 48 passed / 1 failed

### 残り1件の失敗
- `posting.test.ts: 画像の投稿ができる` — 修正前(041769e)からも失敗しており、今回の変更とは無関係。画像添付後にsubmitボタンがdisabledのままになる問題。

## 手動テスト

TBT改善後に全手動テスト項目を再確認済み。全項目通過。
