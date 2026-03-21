# 31. DBインデックス追加 (2026-03-21)

## 変更内容

`sequelize.ts` の `initModels()` 直後に8本のインデックスを `CREATE INDEX IF NOT EXISTS` で作成するコードを追加。`initializeSequelize()` が呼ばれるたびに（サーバー起動時・`POST /api/v1/initialize` 時）インデックスが作成される。

## 追加したインデックス

| インデックス名 | テーブル | カラム | 理由 |
|---|---|---|---|
| `idx_dm_conv_sender_read` | `DirectMessages` | `(conversationId, senderId, isRead)` | DM既読・未読カウント（198k行フルスキャン解消） |
| `idx_dm_conv_createdat` | `DirectMessages` | `(conversationId, createdAt)` | DM表示のORDER BY（TEMP B-TREE解消） |
| `idx_comments_postid_createdat` | `Comments` | `(postId, createdAt)` | コメント取得（46k行フルスキャン解消） |
| `idx_posts_userid` | `Posts` | `(userId)` | ユーザープロフィールの投稿一覧 |
| `idx_dmc_initiatorid` | `DirectMessageConversations` | `(initiatorId)` | DM会話検索 |
| `idx_dmc_memberid` | `DirectMessageConversations` | `(memberId)` | DM会話検索 |
| `idx_pir_postid` | `PostsImagesRelations` | `(postId)` | PK(imageId,postId)のためpostId単独検索がフルスキャン |
| `idx_posts_createdat` | `Posts` | `(createdAt)` | 検索の日付フィルター |

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `server/src/sequelize.ts` | `initModels()` 後に8本のインデックス作成クエリ追加 |

## 計測

未計測
