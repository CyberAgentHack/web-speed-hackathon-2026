# 対象項目

- SQLite テーブルにインデックスを追加し、クエリパフォーマンスを改善する

# 読んだ docs

- `docs/regulation.md`
- `application/server/src/models/index.ts`（リレーション定義）
- `application/server/src/models/Post.ts`
- `application/server/src/models/Comment.ts`
- `application/server/src/models/DirectMessage.ts`
- `application/server/src/models/DirectMessageConversation.ts`
- `application/server/src/models/PostsImagesRelation.ts`
- `application/server/src/models/User.ts`
- `application/server/src/routes/api/post.ts`
- `application/server/src/routes/api/search.ts`
- `application/server/src/routes/api/direct_message.ts`
- `application/server/src/routes/api/user.ts`
- `application/server/src/sequelize.ts`
- `application/server/scripts/insertSeeds.ts`

# 影響範囲

- `application/server/src/models/Post.ts`
- `application/server/src/models/Comment.ts`
- `application/server/src/models/DirectMessage.ts`
- `application/server/src/models/DirectMessageConversation.ts`
- `application/server/src/models/PostsImagesRelation.ts`
- `application/server/database.sqlite`（再構築）

# 発見した問題

## 問題 1: FK カラムにインデックスが一切ない

- SQLite は FK カラムに自動でインデックスを作成しない。
- PK (`id`) と UNIQUE (`Users.username`) による暗黙のインデックスのみが存在。
- 全ての `where` による FK 絞り込み、`include` による JOIN がフルテーブルスキャンになっていた。

## 問題 2: Post の defaultScope で毎回 JOIN が発生

- `Post.findAll` の defaultScope に `include: [user, images, movie, sound]` が設定されており、全ての Post 取得で 4 テーブルの JOIN が走る。
- `PostsImagesRelation` (中間テーブル) の `postId` にインデックスがないため、N+1 相当の負荷。

## 問題 3: Comment 一覧が postId フルスキャン + createdAt ソート

- `Comment.findAll({ where: { postId }, order: [["createdAt", "ASC"]] })` でインデックスなしのフルスキャンが発生。
- Comments テーブルのデータ量が増えるほど影響が大きくなる。

## 問題 4: DM 系クエリが複雑な条件でフルスキャン

- `DirectMessage.count({ where: { senderId: { [Op.ne]: ... }, isRead: false }, include: [conversation] })` が毎回 DM 全件スキャン。
- `DirectMessageConversation.findAll({ where: { [Op.or]: [{ initiatorId }, { memberId }] } })` も両カラムにインデックスなし。
- DM の未読カウントは WebSocket 接続時と `afterSave` フックで頻繁に呼ばれるため、影響が大きい。

# 実装前の仮説

- FK カラムおよび頻出 WHERE/ORDER BY カラムにインデックスを追加することで:
  1. Post 一覧取得の JOIN が高速化（`userId`, `postId` on 中間テーブル）
  2. Comment 一覧が INDEX SEARCH + ソート不要に（複合インデックス `(postId, createdAt)`）
  3. DM 未読カウントが conversation 経由で高速に絞り込み可能に
  4. DM 会話検索が `initiatorId` / `memberId` のインデックスで OR 条件でも高速化
- write 性能への影響は、データ量が小規模（シードデータ）のため無視できる。

# 採用した方針

- Sequelize の `Model.init()` の `indexes` オプションでインデックスを定義。
- `sequelize.sync({ force: true })` による DB 再構築でインデックスを作成（マイグレーション不要）。
- 複合インデックスを優先：`where A = ? order by B` パターンには `(A, B)` の複合インデックスを採用。
- LIKE `%keyword%` のような先頭ワイルドカード検索にはインデックスが効かないため、search の text 検索には追加しない。

# 実装内容

## Post モデル
- `indexes: [{ fields: ["userId"] }, { fields: ["createdAt"] }]` を追加
- `userId`: ユーザーの投稿一覧 (`/users/:username/posts`) で使用
- `createdAt`: 検索の日付フィルタ (`since:`, `until:`) で使用

## Comment モデル
- `indexes: [{ fields: ["postId", "createdAt"] }]` を追加
- `(postId, createdAt)` 複合: コメント一覧 (`where postId = ? order by createdAt ASC`) に直撃

## DirectMessage モデル
- `indexes: [{ fields: ["conversationId", "createdAt"] }, { fields: ["conversationId", "senderId", "isRead"] }, { fields: ["senderId"] }]` を追加
- `(conversationId, createdAt)`: メッセージ一覧の取得とソートをカバー
- `(conversationId, senderId, isRead)`: 未読カウント・既読更新クエリをカバー
- `senderId`: 送信者での絞り込み

## DirectMessageConversation モデル
- `indexes: [{ fields: ["initiatorId"] }, { fields: ["memberId"] }]` を追加
- OR 条件 `(initiatorId = ? OR memberId = ?)` を MULTI-INDEX OR で高速化

## PostsImagesRelation モデル
- `indexes: [{ fields: ["postId"] }, { fields: ["imageId"] }]` を追加
- N:M 中間テーブルの FK。Post の defaultScope で毎回 JOIN されるため効果大

## DB 再構築
- `pnpm run seed:insert` でインデックス付きの `database.sqlite` を再生成

# 検証結果

## EXPLAIN QUERY PLAN による確認

全クエリでインデックスが使用されていることを確認:

| クエリパターン | 実行計画 |
|---|---|
| `SELECT * FROM Comments WHERE postId = ? ORDER BY createdAt ASC` | `SEARCH Comments USING INDEX comments_post_id_created_at (postId=?)` |
| `SELECT * FROM Posts WHERE userId = ?` | `SEARCH Posts USING INDEX posts_user_id (userId=?)` |
| `SELECT * FROM DirectMessages WHERE conversationId = ? ORDER BY createdAt ASC` | `SEARCH DirectMessages USING INDEX direct_messages_conversation_id_created_at (conversationId=?)` |
| `SELECT * FROM DirectMessageConversations WHERE initiatorId = ? OR memberId = ?` | `MULTI-INDEX OR` (両インデックスを使用) |

## 作成されたインデックス一覧（10 個）

```
comments_post_id_created_at
direct_message_conversations_initiator_id
direct_message_conversations_member_id
direct_messages_conversation_id_created_at
direct_messages_conversation_id_sender_id_is_read
direct_messages_sender_id
posts_created_at
posts_images_relations_image_id
posts_images_relations_post_id
posts_user_id
```

# スコア変化

- DB ファイルサイズ: インデックス追加分の微増（数十KB 程度）
- API レスポンス: FK 絞り込み・JOIN がフルスキャンからインデックスサーチに改善
- Lighthouse スコア: サーバーレスポンス時間の短縮による TTFB 改善が期待される

# リスクと未確認事項

- write 性能（insert/update/delete）は index 追加分だけ微増するが、シードデータの規模では無視できる。
- search の `text LIKE '%keyword%'` は先頭ワイルドカードのためインデックスが効かない。FTS5 導入が必要だが、クエリ形式の大幅変更が伴うため今回は見送り。
- `Post.findAll` の `order: [["id", "DESC"]]` は PK の暗黙インデックスでカバー済み。
- seed:insert を再実行済みだが、サーバー起動時に `sequelize.ts` で DB を tmp にコピーするため、次回起動時から自動的にインデックス付き DB が使用される。

# 次にやるべきこと

- サーバーを再起動して API レスポンス時間の実測
- Lighthouse スコア計測でサーバーレスポンス改善の効果を確認
- search の LIKE クエリが重い場合は FTS5 の導入を検討
- `Post.defaultScope` の eager loading 見直し（不要な include の遅延化）
