# 04 Infinite Scroll and Server Pagination

## 背景

無限スクロールが重いスクロール監視ロジックで実装され、加えてクライアント側で「全件取得してから `slice`」する構造だった。

## 実施内容

- `application/client/src/components/foundation/InfiniteScroll.tsx`
  - スクロールイベント多重監視を廃止
  - `IntersectionObserver` ベースの下端検知に変更
  - sentinel 要素を導入し、交差時のみ `fetchMore` を実行
- `application/client/src/hooks/use_infinite_fetch.ts`
  - `limit/offset` 付き URL を自動生成してページ単位取得に変更
  - クライアント側全件 `slice` 処理を廃止
  - `hasMore` 管理を導入し、末尾到達後の不要な再取得を抑制
  - `apiPath` が空の場合のガードを追加（検索初期状態の無駄リクエスト抑止）
- `application/server/src/routes/api/search.ts`
  - `limit/offset` のデフォルト値を設定
  - 重複マージ後の返却をページサイズに合わせるよう整理
  - 二重ページングによる欠落が起きにくい返却方式に修正

## 影響範囲

- タイムライン、投稿コメント、ユーザー投稿、検索結果の追加読み込み

## リスクと対策

- リスク: 検索結果のページ境界で件数が減るケース（重複排除の影響）
- 対策: 既存の重複排除ロジックを維持しつつ、返却サイズを明示制御

## 検証結果

- `pnpm --dir application/client exec tsc --noEmit` 成功
- `pnpm --dir application/server exec tsc --noEmit` 成功
- ローカル採点計測は方針により未実施
