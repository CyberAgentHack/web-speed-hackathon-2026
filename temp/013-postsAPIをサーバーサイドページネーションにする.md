# 013-postsAPIをサーバーサイドページネーションにする

## 概要
useInfiniteFetchが毎回全件取得してクライアントでsliceする疑似ページネーションを、サーバーサイドページネーションに変更する。

## 方針
- useInfiniteFetch内でURLにlimit/offsetクエリパラメータを付与
- サーバーから返った配列をそのまま使用（クライアントslice不要）
- search APIのoffset二重適用バグも修正

## 変更が必要な箇所
1. `application/client/src/hooks/use_infinite_fetch.ts` — URL構築とページネーションロジック
2. `application/server/src/routes/api/search.ts` — offset二重適用バグ修正

## 注意事項
- 呼び出し側の4コンテナは変更不要
- LIMIT=30を維持（search.test.tsが30件以下を検証）
- hasMoreフラグでデータ終端を検知
