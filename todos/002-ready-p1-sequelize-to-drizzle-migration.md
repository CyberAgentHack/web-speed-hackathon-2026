---
status: ready
priority: p1
issue_id: "002"
tags: [server, performance, database, drizzle, migration, bun]
dependencies: ["003", "008"]
---

# Sequelize → Drizzle ORM 移行

## 目的

Hono + Bun 移行の準備として Sequelize を Drizzle ORM (better-sqlite3) に置き換える。
クエリ最適化を同時に実施し、サーバーレスポンス時間を改善する。

**Phase 3 (Bun) への布石:** `drizzle-orm/better-sqlite3` で Node.js 上で動作確認後、Phase 3 で `drizzle-orm/bun-sqlite` に import 変更のみで移行可能。Drizzle + bun:sqlite はファーストクラスサポート (Bun 公式ドキュメント確認済み)。

## 解かないこと

- Express → Hono 移行
- Node.js → Bun ランタイム移行
- クライアント側の変更

## 制約

- 全 API エンドポイントの JSON レスポンス構造を完全に維持すること
- VRT + 手動テスト全パス
- `POST /api/v1/initialize` で DB が初期状態にリセットされること
- シードデータの各種 ID 変更禁止

---

## 1. レスポンス互換性 — 全エンドポイントの JSON 構造

### GET /api/v1/posts?limit=&offset=
```json
[{
  "id": "uuid",
  "text": "string",
  "createdAt": "2026-01-31T23:56:22.307Z",  // ISO 8601
  "updatedAt": "2026-03-19T14:54:21.612Z",
  "userId": "uuid",        // ※ detail scope では exclude されない（コード上は exclude 指定あるが detail scope で上書き）
  "movieId": "uuid | null",
  "soundId": "uuid | null",
  "user": {
    "id": "uuid",
    "username": "string",
    "name": "string",
    "description": "string",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601",
    // password: 除外（getter が undefined 返す）
    // profileImageId: 除外（defaultScope の exclude）
    "profileImage": {
      "id": "uuid",
      "alt": "string",
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601"
    }
  },
  "images": [{
    "id": "uuid",
    "alt": "string",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
    // through 属性（postId, imageId）は除外
  }],
  "movie": { "id": "uuid", "createdAt": "ISO8601", "updatedAt": "ISO8601" } | null,
  "sound": { "id": "uuid", "title": "string", "artist": "string", "createdAt": "ISO8601", "updatedAt": "ISO8601" } | null
}]
```
**注意点:**
- `images` は `createdAt ASC` でソート
- posts は `id DESC` でソート
- detail scope で userId/movieId/soundId が含まれる（defaultScope の exclude が detail scope の include で上書きされるため）

### GET /api/v1/posts/:postId
上記と同一構造（単一オブジェクト）。

### GET /api/v1/posts/:postId/comments?limit=&offset=
```json
[{
  "id": "uuid",
  "text": "string",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601",
  // userId, postId: 除外（defaultScope の exclude）
  "user": {
    "id": "uuid", "username": "string", "name": "string",
    "description": "string", "createdAt": "ISO8601", "updatedAt": "ISO8601",
    "profileImage": { "id": "uuid", "alt": "string", "createdAt": "ISO8601", "updatedAt": "ISO8601" }
  }
}]
```
**注意点:** `createdAt ASC` でソート

### GET /api/v1/users/:username
```json
{
  "id": "uuid", "username": "string", "name": "string",
  "description": "string", "createdAt": "ISO8601", "updatedAt": "ISO8601",
  // password: 除外, profileImageId: 除外
  "profileImage": { "id": "uuid", "alt": "string", "createdAt": "ISO8601", "updatedAt": "ISO8601" }
}
```

### GET /api/v1/me
上記 User と同一構造。

### PUT /api/v1/me
上記 User と同一構造（更新後）。

### POST /api/v1/signup
上記 User と同一構造。エラー時:
- `{ "code": "USERNAME_TAKEN" }` (409相当だが200ではなく400)
- `{ "code": "INVALID_USERNAME" }` (400)

### POST /api/v1/signin
上記 User と同一構造。

### GET /api/v1/users/:username/posts?limit=&offset=
`GET /posts` と同一構造。`userId` で絞り込み。

### GET /api/v1/search?q=&limit=&offset=
`GET /posts` と同一構造。

### GET /api/v1/dm
```json
[{
  "id": "uuid",
  "initiatorId": "uuid",
  "memberId": "uuid",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601",
  "initiator": { /* User構造（profileImage含む） */ },
  "member": { /* User構造（profileImage含む） */ },
  "messages": [{
    "id": "uuid",
    "body": "string",
    "isRead": true|false,
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601",
    "senderId": "uuid",
    "conversationId": "uuid",
    "sender": { /* User構造（profileImage含む） */ }
  }]
}]
```
**注意点:**
- messages が空の会話は除外（`where(col("messages.id"), { [Op.not]: null })`）
- messages は `createdAt ASC` でソート（`reverse()` して `DESC` でソート → ルートで再 `reverse()`）
- 会話は `messages.createdAt DESC` でソート

### GET /api/v1/dm/:conversationId
上記 conversation と同一構造（単一オブジェクト、messages 含む）。

### POST /api/v1/dm
`findOrCreate` → conversation 構造を返す。

### POST /api/v1/dm/:conversationId/messages
```json
{
  "id": "uuid", "body": "string", "isRead": false,
  "createdAt": "ISO8601", "updatedAt": "ISO8601",
  "senderId": "uuid", "conversationId": "uuid",
  "sender": { /* User構造 */ }
}
```
**注意点:** 作成後 `reload()` で defaultScope 適用（sender を含む）

### POST /api/v1/dm/:conversationId/read
`{}` を返す。

### POST /api/v1/dm/:conversationId/typing
`{}` を返す。

### WS /api/v1/dm/unread/ws
`{ "type": "dm:unread", "payload": { "unreadCount": number } }`

### WS /api/v1/dm/:conversationId/ws
`{ "type": "dm:conversation:message", "payload": { /* DirectMessage構造 */ } }`
`{ "type": "dm:conversation:typing", "payload": {} }`

### POST /api/v1/posts
Post 構造を返す（images, movie, sound の nested create 含む）。

### POST /api/v1/initialize
`{}` を返す。DB リセット + セッションクリア + upload ディレクトリクリア。

### GET /api/v1/crok/suggestions
`{ "suggestions": ["string", ...] }`

### POST /api/v1/images, /movies, /sounds
`{ "id": "uuid" }` / `{ "id": "uuid", "title": "string", "artist": "string" }`
（DB 操作なし、ファイル保存のみ）

---

## 2. クエリ移行の詳細 — Sequelize → Drizzle 変換

### 2-1. auth.ts

**User.create(req.body) → insert + select**
```typescript
// Before (Sequelize)
const { id: userId } = await User.create(req.body);
const user = await User.findByPk(userId);

// After (Drizzle)
const id = crypto.randomUUID();
const hashedPassword = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8));
db.insert(users).values({
  id,
  username: req.body.username,
  name: req.body.name,
  description: req.body.description ?? "",
  password: hashedPassword,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}).run();  // better-sqlite3 は同期

const user = db.query.users.findFirst({
  where: eq(users.id, id),
  with: { profileImage: true },
  columns: { password: false, profileImageId: false },
});
```

**UniqueConstraintError → SQLite error code**
```typescript
// Before
} catch (err) {
  if (err instanceof UniqueConstraintError) { ... }
  if (err instanceof ValidationError) { ... }
}

// After
try {
  // username validation (手動)
  if (!/^[a-z0-9_-]+$/i.test(req.body.username)) {
    return res.status(400).json({ code: "INVALID_USERNAME" });
  }
  db.insert(users).values({...}).run();
} catch (err: any) {
  if (err.message?.includes("UNIQUE constraint failed")) {
    return res.status(400).json({ code: "USERNAME_TAKEN" });
  }
  throw err;
}
```

**User.findOne({ where: { username } }) → select**
```typescript
// Before
const user = await User.findOne({ where: { username: req.body.username } });

// After
const user = db.query.users.findFirst({
  where: eq(users.username, req.body.username),
  with: { profileImage: true },
  columns: { password: false, profileImageId: false },
});
```
**注意:** password は除外するが、`validPassword` のためにハッシュが必要。
→ 2段クエリ: まず password 含めて取得、検証後、レスポンス用に password/profileImageId を除外して返す。

```typescript
const row = db.select().from(users).where(eq(users.username, req.body.username)).get();
if (!row) throw new httpErrors.BadRequest();
if (!bcrypt.compareSync(req.body.password, row.password)) throw new httpErrors.BadRequest();

// レスポンス用
const profileImage = db.select().from(profileImages).where(eq(profileImages.id, row.profileImageId)).get();
const { password, profileImageId, ...userResponse } = row;
return res.json({ ...userResponse, profileImage });
```

### 2-2. user.ts

**User.findByPk(id)**
```typescript
// After
const user = db.query.users.findFirst({
  where: eq(users.id, id),
  with: { profileImage: true },
  columns: { password: false, profileImageId: false },
});
```

**user.save() (Object.assign + save)**
```typescript
// Before
Object.assign(user, req.body);
await user.save();

// After
db.update(users)
  .set({
    ...req.body,
    updatedAt: new Date().toISOString(),
    // password がある場合は bcrypt hash
    ...(req.body.password ? { password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8)) } : {}),
  })
  .where(eq(users.id, req.session.userId))
  .run();

// 更新後を返す
const updated = db.query.users.findFirst({
  where: eq(users.id, req.session.userId),
  with: { profileImage: true },
  columns: { password: false, profileImageId: false },
});
return res.json(updated);
```

### 2-3. post.ts

**Post.scope("detail").findAll({ limit, offset })**
```typescript
// After — relational query
const results = db.query.posts.findMany({
  with: {
    user: {
      with: { profileImage: true },
      columns: { password: false, profileImageId: false },
    },
    postImages: {
      with: { image: true },
      columns: {},  // through テーブルのカラムは除外
    },
    movie: true,
    sound: true,
  },
  orderBy: [desc(posts.id)],
  limit,
  offset,
});

// images の整形（through テーブル経由 → フラット化）
const formatted = results.map(post => ({
  ...post,
  images: post.postImages
    .map(pi => pi.image)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  postImages: undefined,
}));
```

**Post.create with nested include**
```typescript
// Before
const post = await Post.create({ ...req.body, userId }, {
  include: [{ association: "images", through: { attributes: [] } }, { association: "movie" }, { association: "sound" }],
});

// After — 個別 insert
const postId = crypto.randomUUID();
const now = new Date().toISOString();

db.transaction(() => {
  db.insert(posts).values({
    id: postId,
    text: req.body.text,
    userId: req.session.userId,
    movieId: req.body.movie?.id ?? null,
    soundId: req.body.sound?.id ?? null,
    createdAt: now,
    updatedAt: now,
  }).run();

  if (req.body.images?.length) {
    for (const img of req.body.images) {
      db.insert(postsImagesRelation).values({
        postId,
        imageId: img.id,
        createdAt: now,
        updatedAt: now,
      }).run();
    }
  }
})();

const post = /* select with relations */;
return res.json(post);
```

**Comment.findAll({ where: { postId } })**
```typescript
// After
const results = db.query.comments.findMany({
  where: eq(comments.postId, req.params.postId),
  with: {
    user: {
      with: { profileImage: true },
      columns: { password: false, profileImageId: false },
    },
  },
  columns: { userId: false, postId: false },
  orderBy: [asc(comments.createdAt)],
  limit,
  offset,
});
```

### 2-4. search.ts

**2クエリ → 1クエリ統合（最適化）**
```typescript
// Before: 2クエリ（テキスト検索 + ユーザー名検索）→ JS merge/dedup/sort/slice
// After: 1クエリ + OR 条件

// ベースのwhere条件
const conditions: SQL[] = [];

if (searchTerm) {
  // サブクエリ: テキスト一致 OR ユーザー名/名前一致
  conditions.push(
    or(
      like(posts.text, searchTerm),
      inArray(posts.userId,
        db.select({ id: users.id }).from(users).where(
          or(like(users.username, searchTerm), like(users.name, searchTerm))
        )
      )
    )
  );
}

if (sinceDate) {
  conditions.push(gte(posts.createdAt, sinceDate.toISOString()));
}
if (untilDate) {
  conditions.push(lte(posts.createdAt, untilDate.toISOString()));
}

const results = db.query.posts.findMany({
  where: and(...conditions),
  with: { user: { with: { profileImage: true }, columns: { password: false, profileImageId: false } },
          postImages: { with: { image: true } }, movie: true, sound: true },
  orderBy: [desc(posts.createdAt)],
  limit,
  offset,
});
```
**注意:** 元の実装はテキスト検索結果 → ユーザー検索結果を concat → dedup → sort → re-slice していて、offset/limit の扱いが二重適用で微妙にバグっている。Drizzle 移行で正しい SQL に統合することで挙動が若干変わる可能性がある。安全策は元の2クエリパターンを維持しつつ Drizzle 化。

### 2-5. direct_message.ts（最複雑）

**GET /dm — 会話一覧（3段ネスト eager loading）**
```typescript
// Before: DirectMessageConversation.findAll({defaultScope + where + order})
// defaultScope = initiator(+profileImage) + member(+profileImage) + messages(+sender(+profileImage))

// After:
const conversations = db.query.directMessageConversations.findMany({
  where: or(
    eq(directMessageConversations.initiatorId, userId),
    eq(directMessageConversations.memberId, userId),
  ),
  with: {
    initiator: { with: { profileImage: true }, columns: { password: false, profileImageId: false } },
    member: { with: { profileImage: true }, columns: { password: false, profileImageId: false } },
    messages: {
      with: {
        sender: { with: { profileImage: true }, columns: { password: false, profileImageId: false } },
      },
      orderBy: [asc(directMessages.createdAt)],
    },
  },
});

// messages が空の会話を除外 + messages.createdAt DESC でソート
const filtered = conversations
  .filter(c => c.messages.length > 0)
  .sort((a, b) => {
    const aLast = a.messages[a.messages.length - 1]!.createdAt;
    const bLast = b.messages[b.messages.length - 1]!.createdAt;
    return bLast.localeCompare(aLast);
  });
```

**POST /dm — findOrCreate**
```typescript
// Before: DirectMessageConversation.findOrCreate({ where: { [Op.or]: [...] }, defaults: {...} })

// After:
const existing = db.query.directMessageConversations.findFirst({
  where: or(
    and(eq(directMessageConversations.initiatorId, userId), eq(directMessageConversations.memberId, peerId)),
    and(eq(directMessageConversations.initiatorId, peerId), eq(directMessageConversations.memberId, userId)),
  ),
  with: { initiator: {...}, member: {...}, messages: {...} },
});

if (!existing) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.insert(directMessageConversations).values({
    id, initiatorId: userId, memberId: peerId,
    createdAt: now, updatedAt: now,
  }).run();
  // re-select with relations
}
```

**DirectMessage.count (unread) — 複雑サブクエリ**
```typescript
// Before: DirectMessage.count({ where: { senderId: { [Op.ne]: receiverId }, isRead: false },
//          include: [{ association: "conversation", where: { [Op.or]: [...] }, required: true }] })

// After: SQL join で直接カウント
const result = db
  .select({ count: count() })
  .from(directMessages)
  .innerJoin(directMessageConversations, eq(directMessages.conversationId, directMessageConversations.id))
  .where(and(
    ne(directMessages.senderId, receiverId),
    eq(directMessages.isRead, false),
    or(
      eq(directMessageConversations.initiatorId, receiverId),
      eq(directMessageConversations.memberId, receiverId),
    ),
  ))
  .get();

const unreadCount = result?.count ?? 0;
```

**DirectMessage.update (mark as read)**
```typescript
// Before: DirectMessage.update({ isRead: true }, { where: {...}, individualHooks: true })
// individualHooks: true → 各行で afterSave が発火

// After: update + 手動で通知
const now = new Date().toISOString();
const updated = db.update(directMessages)
  .set({ isRead: true, updatedAt: now })
  .where(and(
    eq(directMessages.conversationId, conversationId),
    eq(directMessages.senderId, peerId),
    eq(directMessages.isRead, false),
  ))
  .returning()
  .all();

// afterSave 相当の通知を手動発火
for (const msg of updated) {
  sendDmNotification(msg);
}
```

**afterSave hook → sendDmNotification 関数**
```typescript
// Before: DirectMessage.addHook("afterSave", ...) — 自動発火
// After: 明示呼び出し関数

export function sendDmNotification(message: typeof directMessages.$inferSelect) {
  const conversation = db.select().from(directMessageConversations)
    .where(eq(directMessageConversations.id, message.conversationId)).get();
  if (!conversation) return;

  const receiverId = conversation.initiatorId === message.senderId
    ? conversation.memberId : conversation.initiatorId;

  // unread count
  const result = db.select({ count: count() }).from(directMessages)
    .innerJoin(directMessageConversations, eq(directMessages.conversationId, directMessageConversations.id))
    .where(and(
      ne(directMessages.senderId, receiverId),
      eq(directMessages.isRead, false),
      or(eq(directMessageConversations.initiatorId, receiverId), eq(directMessageConversations.memberId, receiverId)),
    )).get();

  // sender を含む完全なメッセージを取得
  const fullMessage = db.query.directMessages.findFirst({
    where: eq(directMessages.id, message.id),
    with: { sender: { with: { profileImage: true }, columns: { password: false, profileImageId: false } } },
  });

  eventhub.emit(`dm:conversation/${conversation.id}:message`, fullMessage);
  eventhub.emit(`dm:unread/${receiverId}`, { unreadCount: result?.count ?? 0 });
}
```

### 2-6. crok.ts

```typescript
// Before: QaSuggestion.findAll({ logging: false })
// After:
const suggestions = db.select().from(qaSuggestions).all();
```

### 2-7. initialize.ts

```typescript
// Before: await initializeSequelize();
// After: initializeDb();  // better-sqlite3 は同期
```

### 2-8. seeds.ts

```typescript
// Before: Model.bulkCreate(batch, { transaction })
// After:
export function insertSeeds(db: DrizzleDB) {
  db.transaction(() => {
    // 各テーブルについて
    readJsonlFileBatchedSync<ProfileImageSeed>("profileImages.jsonl", (batch) => {
      db.insert(profileImages).values(batch).run();
    });
    // ... 全テーブル同様
  })();
}
```

---

## 3. リスク分析

### CRITICAL

#### C1. パスワードハッシュ（seed 挿入時）

**問題:** シード JSONL の password は平文 (`"wsh-2026"`)。Sequelize の `User.bulkCreate()` は setter で自動 bcrypt ハッシュ化するが、Drizzle にはこの機能がない。平文のまま DB に入ると全ユーザーのログインが壊れる。

**対策:** seed 挿入処理で User のみ明示的にハッシュ化:
```typescript
await readJsonlFileBatched<UserSeed>("users.jsonl", (batch) => {
  const hashed = batch.map(u => ({
    ...u,
    password: bcrypt.hashSync(u.password, bcrypt.genSaltSync(8)),
    updatedAt: u.createdAt ?? now,
  }));
  db.insert(users).values(hashed).run();
});
```

#### C2. updatedAt 自動生成（seed 挿入時）

**問題:** 大半のシード JSONL に `updatedAt` が含まれない。Sequelize は `bulkCreate` 時に自動生成するが Drizzle にはない。`updatedAt NOT NULL` 制約に違反して seed 挿入が失敗する。

**確認済み欠如状況:**

| テーブル | updatedAt | createdAt | 対策 |
|---------|:-:|:-:|------|
| Users | - | o | `createdAt` をコピー |
| Posts | - | o | `createdAt` をコピー |
| Comments | - | o | `createdAt` をコピー |
| Images | - | o | `createdAt` をコピー |
| Movies | - | - | `now` を付与 |
| Sounds | - | - | `now` を付与 |
| ProfileImages | - | - | `now` を付与 |
| PostsImagesRelations | - | - | `now` を付与 |
| DirectMessageConversations | - | - | `now` を付与 |
| DirectMessages | o | o | そのまま |
| qa_suggestions | N/A | N/A | timestamps なし |

**対策:** seed 挿入時に欠如フィールドを補完するユーティリティ:
```typescript
function fillTimestamps<T extends Record<string, unknown>>(row: T, now: string): T & { createdAt: string; updatedAt: string } {
  return {
    ...row,
    createdAt: (row.createdAt as string) ?? now,
    updatedAt: (row.updatedAt as string) ?? (row.createdAt as string) ?? now,
  };
}
```

### HIGH

#### H1. スキーマ作成（`sync({ force: true })` 相当）

**問題:** `insertSeeds.ts` は `sequelize.sync({ force: true })` でテーブルを作成する。Drizzle には同等のランタイム API がない。

**対策:** `drizzle-kit push` を `seed:insert` スクリプトに組み込む:
```json
"seed:insert": "drizzle-kit push && tsx ./scripts/insertSeeds.ts"
```
`drizzle.config.ts` を作成し、schema と DB パスを指定。

#### H2. Posts シードに movieId/soundId がない

**問題:** `PostSeed` 型に `movieId`/`soundId` が定義されているが、実際のシード JSONL にはキーが存在しない行が多い。Sequelize は `undefined` を `null` 扱いするが、Drizzle は明示的な値が必要。

**対策:** schema.ts で `movieId` と `soundId` を nullable に定義（`notNull()` を付けない）。seed 挿入時に `movieId: row.movieId ?? null` を明示。

### MEDIUM

#### M1. Date 型変換

**問題:** SQLite は `"2026-01-31 23:56:22.307 +00:00"` 形式。レスポンスは `"2026-01-31T23:56:22.307Z"` (ISO 8601)。

**対策:** `new Date(sqliteDatetime).toISOString()` で変換する `formatDates` ヘルパーを作成。ネストリレーション（user.profileImage 等）にも再帰的に適用。全エンドポイントで API contract テスト（003）が検証。

#### M2. Scope → With の挙動差異

**問題:** Sequelize の `defaultScope` は暗黙的に全クエリに適用。Drizzle では各クエリで明示指定が必要。

**具体的な差異:**

| Sequelize scope | 効果 | Drizzle での再現 |
|----------------|------|-----------------|
| User defaultScope | `exclude: ["profileImageId"]`, `include: profileImage` | `columns: { password: false, profileImageId: false }`, `with: { profileImage: true }` |
| Post defaultScope | `exclude: ["userId","movieId","soundId"]`, `order: id DESC` | detail scope では FK を含めるため exclude しない |
| Post detail scope | 全リレーション include | `with: { user: {...}, postImages: {...}, movie: true, sound: true }` |
| Comment defaultScope | `exclude: ["userId","postId"]`, include user+profileImage, order createdAt ASC | 各クエリで明示指定 |
| DirectMessage defaultScope | include sender+profileImage, order createdAt ASC | 各クエリで明示指定 |
| DirectMessageConversation defaultScope | include initiator+member+messages(+sender) | 各クエリで明示指定 |

**対策:** scope 相当のクエリパターンをヘルパーオブジェクトとして定義:
```typescript
// db/queries.ts
export const userWithProfile = {
  with: { profileImage: true },
  columns: { password: false, profileImageId: false },
} as const;
```

#### M3. エラーハンドリング

**問題:** Sequelize の `UniqueConstraintError`, `ValidationError` をキャッチしている箇所が 3 つ。

| 箇所 | Sequelize エラー | Drizzle / better-sqlite3 相当 |
|------|-----------------|------|
| auth.ts:17 | `UniqueConstraintError` | `SqliteError: UNIQUE constraint failed: Users.username` |
| auth.ts:20 | `ValidationError` (username regex) | 手動バリデーション |
| api.ts:30 | `ValidationError` (汎用) | 手動バリデーション |

**対策:**
- `UniqueConstraintError` → `err.message.includes("UNIQUE constraint failed")` でキャッチ
- `ValidationError` → insert 前に手動 regex チェック
- api.ts のグローバルエラーハンドラから `ValidationError` import を削除

#### M4. Many-to-Many リレーション

**問題:** `Post.belongsToMany(Image, { through: PostsImagesRelation })` は Drizzle の relational query で直接サポートされない。

**対策:** 中間テーブル経由の2段リレーション + レスポンス整形で `post.postImages.map(pi => pi.image)` とフラット化。

#### M5. Post.create の nested include

**問題:** Sequelize は `Post.create({ ...data, images: [...] }, { include: [...] })` で関連テーブルに自動 insert するが、Drizzle にはない。

**対策:** transaction 内で個別 insert:
```typescript
db.transaction(() => {
  db.insert(posts).values({ id: postId, ... }).run();
  for (const img of req.body.images ?? []) {
    db.insert(postsImagesRelation).values({ postId, imageId: img.id, ... }).run();
  }
})();
```

### LOW

- **findOrCreate:** select → なければ insert。SQLite 単一プロセスで race condition リスクなし。
- **individualHooks:** `update().returning()` で更新行取得 → 各行に `sendDmNotification()` 明示呼び出し。
- **updatedAt 自動更新（ランタイム）:** 全 `update()` 箇所で `updatedAt: new Date().toISOString()` を明示 set。対象: auth.ts, user.ts, direct_message.ts。
- **テーブル名:** 確認済み。`Users`, `Posts`, `Comments`, `Images`, `Movies`, `Sounds`, `ProfileImages`, `PostsImagesRelations`, `DirectMessageConversations`, `DirectMessages`, `qa_suggestions`。
- **bcrypt → Bun 移行時:** bcrypt は Node.js ネイティブアドオン。Bun 移行時に `bcryptjs` に要変更。今回スコープ外。
- **generateSeeds.ts:** Sequelize 不使用（faker のみ）。影響なし。
- **WebSocket:** ORM 無関係。影響なし。

---

## 4. テスト戦略

### 4-1. 移行中の動作確認手順

**ステップ 1: スキーマ + DB接続**
```bash
# insertSeeds.ts を Drizzle 版に書き換えた後
pnpm --filter @web-speed-hackathon-2026/server seed:generate
pnpm --filter @web-speed-hackathon-2026/server seed:insert
# → database.sqlite が正しく生成されることを確認
sqlite3 database.sqlite ".tables"
sqlite3 database.sqlite "SELECT count(*) FROM Users;"
```

**ステップ 2: エンドポイント単位の回帰テスト**

各エンドポイントについて、移行前のレスポンスを保存し、移行後と比較する。

```bash
# 移行前に全レスポンスを保存
mkdir -p /tmp/wsh-baseline
curl -s 'http://localhost:3000/api/v1/posts?limit=3' | jq . > /tmp/wsh-baseline/posts.json
curl -s 'http://localhost:3000/api/v1/posts/d1bd6ba1-b5ba-4129-a16d-e1f898c3de1a' | jq . > /tmp/wsh-baseline/post-detail.json
curl -s 'http://localhost:3000/api/v1/posts/d1bd6ba1-b5ba-4129-a16d-e1f898c3de1a/comments?limit=3' | jq . > /tmp/wsh-baseline/comments.json
curl -s 'http://localhost:3000/api/v1/users/j34hm2ijhidq' | jq . > /tmp/wsh-baseline/user.json
curl -s 'http://localhost:3000/api/v1/users/j34hm2ijhidq/posts?limit=3' | jq . > /tmp/wsh-baseline/user-posts.json
curl -s 'http://localhost:3000/api/v1/crok/suggestions' | jq . > /tmp/wsh-baseline/suggestions.json
# auth + DM は session 必要 → スクリプト化
```

```bash
# 移行後に差分確認
diff <(jq -S . /tmp/wsh-baseline/posts.json) <(curl -s 'http://localhost:3000/api/v1/posts?limit=3' | jq -S .)
# updatedAt が変わる場合があるので、updatedAt を除外して比較
diff <(jq -S 'del(..|.updatedAt?)' /tmp/wsh-baseline/posts.json) \
     <(curl -s 'http://localhost:3000/api/v1/posts?limit=3' | jq -S 'del(..|.updatedAt?)')
```

テスト対象エンドポイント（優先順）:
1. `GET /posts?limit=3` — 基本的なリレーション + ソート + ページネーション
2. `GET /posts/:postId` — 単一取得 + detail scope
3. `GET /posts/:postId/comments` — Comment + User ネスト
4. `GET /users/:username` — User + profileImage
5. `GET /me` — セッション認証
6. `POST /signup` → `POST /signin` → `POST /signout` — 認証フロー
7. `GET /dm` — 3段ネスト + フィルタリング + ソート
8. `POST /dm/:id/messages` — DM 作成 + 通知
9. `GET /search?q=xxx` — 検索クエリ
10. `POST /initialize` — DB リセット

**ステップ 3: VRT**
```bash
cd application && pnpm exec playwright test
```

**ステップ 4: 手動テスト**
`docs/test_cases.md` のチェックリストに沿って実施。

### 4-2. ベースライン取得スクリプト

`bench/baseline-api.sh` として保存:
```bash
#!/bin/bash
BASE=http://localhost:3000/api/v1
OUT=/tmp/wsh-baseline
mkdir -p $OUT

# Public endpoints
curl -s "$BASE/posts?limit=3" | jq -S . > $OUT/posts.json
curl -s "$BASE/posts?limit=3&offset=3" | jq -S . > $OUT/posts-page2.json
curl -s "$BASE/posts/d1bd6ba1-b5ba-4129-a16d-e1f898c3de1a" | jq -S . > $OUT/post-detail.json
curl -s "$BASE/posts/126968c6-890f-494d-922f-208c160d06a4" | jq -S . > $OUT/post-movie.json
curl -s "$BASE/posts/d0d4a8a6-20ed-4a6a-a2d4-3e8bcc7ffc43" | jq -S . > $OUT/post-sound.json
curl -s "$BASE/posts/d1bd6ba1-b5ba-4129-a16d-e1f898c3de1a/comments?limit=3" | jq -S . > $OUT/comments.json
curl -s "$BASE/users/j34hm2ijhidq" | jq -S . > $OUT/user.json
curl -s "$BASE/users/j34hm2ijhidq/posts?limit=3" | jq -S . > $OUT/user-posts.json
curl -s "$BASE/crok/suggestions" | jq -S . > $OUT/suggestions.json

# Auth + DM
COOKIES=$(mktemp)
curl -s -c $COOKIES -X POST "$BASE/signin" -H 'Content-Type: application/json' -d '{"username":"o6yq16leo","password":"wsh-2026"}' | jq -S . > $OUT/signin.json
curl -s -b $COOKIES "$BASE/me" | jq -S . > $OUT/me.json
curl -s -b $COOKIES "$BASE/dm" | jq -S '.[0] | {id, initiatorId, memberId, createdAt, updatedAt, initiator: .initiator, member: .member, messages_count: (.messages | length), first_message: .messages[0], last_message: .messages[-1]}' > $OUT/dm-list.json
rm $COOKIES

echo "Baseline saved to $OUT"
ls -la $OUT
```

### 4-3. 差分比較スクリプト

`bench/compare-api.sh`:
```bash
#!/bin/bash
BASE=http://localhost:3000/api/v1
OUT=/tmp/wsh-baseline
FAIL=0

compare() {
  local name=$1 url=$2
  local new=$(curl -s "$url" | jq -S .)
  local old=$(cat "$OUT/$name.json")
  if [ "$(echo "$old" | md5sum)" = "$(echo "$new" | md5sum)" ]; then
    echo "✓ $name"
  else
    echo "✗ $name — DIFF DETECTED"
    diff <(echo "$old") <(echo "$new") | head -20
    FAIL=1
  fi
}

compare posts "$BASE/posts?limit=3"
compare post-detail "$BASE/posts/d1bd6ba1-b5ba-4129-a16d-e1f898c3de1a"
compare post-movie "$BASE/posts/126968c6-890f-494d-922f-208c160d06a4"
compare post-sound "$BASE/posts/d0d4a8a6-20ed-4a6a-a2d4-3e8bcc7ffc43"
compare comments "$BASE/posts/d1bd6ba1-b5ba-4129-a16d-e1f898c3de1a/comments?limit=3"
compare user "$BASE/users/j34hm2ijhidq"
compare user-posts "$BASE/users/j34hm2ijhidq/posts?limit=3"
compare suggestions "$BASE/crok/suggestions"

exit $FAIL
```

---

## 実装順序

| Step | 作業 | 確認方法 | 所要時間 |
|------|------|---------|---------|
| 0 | ベースライン取得 | `bench/baseline-api.sh` 実行 | 5分 |
| 1 | `pnpm add drizzle-orm better-sqlite3` / `pnpm remove sequelize sqlite3` | ビルド通る | 5分 |
| 2 | `db/schema.ts` 作成（11テーブル + リレーション定義） | TypeScript コンパイル | 20分 |
| 3 | `db/index.ts` 作成（接続 + initializeDb） | seed:insert 通る | 10分 |
| 4 | `seeds.ts` + `insertSeeds.ts` 移行 | `seed:insert` → テーブル件数確認 | 15分 |
| 5 | Date 変換ヘルパー + scope ヘルパー作成 | 単体テスト | 10分 |
| 6 | crok.ts 移行（最小） | `/crok/suggestions` 比較 | 5分 |
| 7 | user.ts 移行 | `/users/:username`, `/me` 比較 | 15分 |
| 8 | auth.ts 移行 | signup/signin/signout 比較 | 15分 |
| 9 | post.ts 移行 | `/posts`, `/posts/:id`, `/posts/:id/comments` 比較 | 20分 |
| 10 | search.ts 移行 | `/search` 比較 | 15分 |
| 11 | direct_message.ts 移行 | `/dm` 全エンドポイント比較 | 30分 |
| 12 | initialize.ts 移行 | `POST /initialize` → 全エンドポイント再確認 | 10分 |
| 13 | api.ts エラーハンドラ修正 | エラーケース確認 | 5分 |
| 14 | models/ ディレクトリ削除 + 不要 import 除去 | ビルド通る | 10分 |
| 15 | VRT 実行 | 全テスト通過 | 10分 |
| 16 | `bench/compare-api.sh` で最終確認 | 全一致 | 5分 |

合計: 約 3.5 時間

## Acceptance Criteria

- [ ] `pnpm build` が通る（sequelize の import が 0）
- [ ] `seed:insert` が正常に database.sqlite を生成する
- [ ] `bench/compare-api.sh` が全エンドポイントで一致
- [ ] `POST /initialize` で DB がリセットされる
- [ ] DM WebSocket が正常動作する（unread count + message 通知）
- [ ] VRT 全テスト通過
- [ ] 手動テスト全項目通過
- [ ] package.json から sequelize, sqlite3 が除去されている
- [ ] models/ ディレクトリが削除されている
