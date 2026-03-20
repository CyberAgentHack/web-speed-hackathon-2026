---
status: ready
priority: p1
issue_id: "003"
tags: [server, testing, contract, e2e, migration-safety]
dependencies: []
---

# API Contract テスト + E2E テスト導入

## 目的

ORM 移行（002）と将来の Hono + Bun 移行の回帰テスト基盤を作る。
一度作れば全ての server 側変更で再利用できる資産。

## 解かないこと

- クライアント側のユニットテスト
- 既存 VRT テストの変更（そのまま活用）
- パフォーマンステスト（bench/ が既にある）

## 制約

- 既存の e2e ディレクトリ（Playwright）に統合
- globalSetup の `POST /initialize` による DB リセットを活用
- テスト実行が 2 分以内に収まること（API contract テストのみ）

---

## 設計

### 2層構成

```
application/e2e/src/
├── api/                          # ← NEW: API contract テスト
│   ├── api-helpers.ts            # 共通の fetch + assert ヘルパー
│   ├── schemas.ts                # zod スキーマ（レスポンス構造定義）
│   ├── posts.api.test.ts         # /posts エンドポイント
│   ├── users.api.test.ts         # /users, /me エンドポイント
│   ├── auth.api.test.ts          # /signup, /signin, /signout
│   ├── dm.api.test.ts            # /dm エンドポイント
│   ├── search.api.test.ts        # /search エンドポイント
│   ├── crok.api.test.ts          # /crok エンドポイント
│   └── initialize.api.test.ts    # /initialize エンドポイント
├── auth.test.ts                  # 既存 VRT + 機能テスト
├── dm.test.ts                    # 既存
├── home.test.ts                  # 既存
├── ...                           # 既存
└── utils.ts                      # 既存
```

### API Contract テスト — 何をテストするか

**レスポンス構造の検証（zod parse）**: JSON のキー名、型、ネスト構造が変わっていないこと。
**レスポンス値の検証**: シードデータに基づく具体的な値が返ること。
**ソート順の検証**: posts は id DESC、comments は createdAt ASC、DM messages は createdAt ASC。
**フィルタリングの検証**: defaultScope の exclude（password, profileImageId）が適用されていること。
**エラーレスポンスの検証**: 400/401/404 時の JSON 構造。

### E2E テスト — 既存との差分

既存の e2e は VRT + ブラウザ操作の機能テスト。
追加するのは **API レベルの機能テスト**（ブラウザ不要、`request` context で直接 HTTP）:
- 認証フロー（signup → signin → me → signout → me が 401）
- DM 作成 → メッセージ送信 → 既読マーク → unread count 検証
- Post 作成 → 取得 → コメント取得
- Initialize → 全データリセット確認

---

## 1. zod スキーマ定義（schemas.ts）

```typescript
import { z } from "zod";

// ISO 8601 日付文字列
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

// --- Base schemas ---

export const ProfileImageSchema = z.object({
  id: z.string().uuid(),
  alt: z.string(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  name: z.string(),
  description: z.string(),
  createdAt: isoDate,
  updatedAt: isoDate,
  profileImage: ProfileImageSchema,
}).strict();  // password, profileImageId が含まれないことを保証

export const ImageSchema = z.object({
  id: z.string().uuid(),
  alt: z.string(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

export const MovieSchema = z.object({
  id: z.string().uuid(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

export const SoundSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  artist: z.string(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

export const PostDetailSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  createdAt: isoDate,
  updatedAt: isoDate,
  userId: z.string().uuid(),
  movieId: z.string().uuid().nullable(),
  soundId: z.string().uuid().nullable(),
  user: UserSchema,
  images: z.array(ImageSchema),
  movie: MovieSchema.nullable(),
  sound: SoundSchema.nullable(),
});

export const CommentSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  createdAt: isoDate,
  updatedAt: isoDate,
  user: UserSchema,
}).strict();  // userId, postId が含まれないことを保証

export const DirectMessageSchema = z.object({
  id: z.string().uuid(),
  body: z.string(),
  isRead: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
  senderId: z.string().uuid(),
  conversationId: z.string().uuid(),
  sender: UserSchema,
});

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  initiatorId: z.string().uuid(),
  memberId: z.string().uuid(),
  createdAt: isoDate,
  updatedAt: isoDate,
  initiator: UserSchema,
  member: UserSchema,
  messages: z.array(DirectMessageSchema),
});

export const ErrorSchema = z.object({
  message: z.string(),
});

export const AuthErrorSchema = z.object({
  code: z.enum(["USERNAME_TAKEN", "INVALID_USERNAME"]),
});

export const SuggestionsSchema = z.object({
  suggestions: z.array(z.string()),
});
```

## 2. API ヘルパー（api-helpers.ts）

```typescript
import { APIRequestContext } from "@playwright/test";

const BASE = "/api/v1";

export class ApiClient {
  constructor(private request: APIRequestContext) {}

  // --- Auth ---
  async signup(data: { username: string; name: string; password: string }) {
    return this.request.post(`${BASE}/signup`, { data });
  }
  async signin(data: { username: string; password: string }) {
    return this.request.post(`${BASE}/signin`, { data });
  }
  async signout() {
    return this.request.post(`${BASE}/signout`);
  }
  async me() {
    return this.request.get(`${BASE}/me`);
  }

  // --- Posts ---
  async getPosts(params?: { limit?: number; offset?: number }) {
    const q = new URLSearchParams();
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.offset) q.set("offset", String(params.offset));
    return this.request.get(`${BASE}/posts?${q}`);
  }
  async getPost(postId: string) {
    return this.request.get(`${BASE}/posts/${postId}`);
  }
  async getComments(postId: string, params?: { limit?: number; offset?: number }) {
    const q = new URLSearchParams();
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.offset) q.set("offset", String(params.offset));
    return this.request.get(`${BASE}/posts/${postId}/comments?${q}`);
  }

  // --- Users ---
  async getUser(username: string) {
    return this.request.get(`${BASE}/users/${username}`);
  }
  async getUserPosts(username: string, params?: { limit?: number; offset?: number }) {
    const q = new URLSearchParams();
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.offset) q.set("offset", String(params.offset));
    return this.request.get(`${BASE}/users/${username}/posts?${q}`);
  }

  // --- DM ---
  async getDmList() {
    return this.request.get(`${BASE}/dm`);
  }
  async createDm(peerId: string) {
    return this.request.post(`${BASE}/dm`, { data: { peerId } });
  }
  async getDm(conversationId: string) {
    return this.request.get(`${BASE}/dm/${conversationId}`);
  }
  async sendDmMessage(conversationId: string, body: string) {
    return this.request.post(`${BASE}/dm/${conversationId}/messages`, { data: { body } });
  }
  async markDmRead(conversationId: string) {
    return this.request.post(`${BASE}/dm/${conversationId}/read`);
  }

  // --- Search ---
  async search(q: string, params?: { limit?: number; offset?: number }) {
    const p = new URLSearchParams({ q });
    if (params?.limit) p.set("limit", String(params.limit));
    if (params?.offset) p.set("offset", String(params.offset));
    return this.request.get(`${BASE}/search?${p}`);
  }

  // --- Crok ---
  async getCrokSuggestions() {
    return this.request.get(`${BASE}/crok/suggestions`);
  }

  // --- Initialize ---
  async initialize() {
    return this.request.post(`${BASE}/initialize`);
  }
}
```

## 3. テストケース一覧

### 3-1. posts.api.test.ts

| # | テスト名 | 検証内容 |
|---|---------|---------|
| 1 | `GET /posts — レスポンス構造が PostDetailSchema に一致` | zod parse, 全キー存在, password/profileImageId 除外 |
| 2 | `GET /posts?limit=3 — 3件返る` | `.length === 3` |
| 3 | `GET /posts — id DESC でソートされている` | `posts[0].id > posts[1].id`（UUID辞書順） |
| 4 | `GET /posts?limit=3&offset=3 — ページ2が返る` | page1 と重複しない |
| 5 | `GET /posts/:postId — 単一投稿が返る` | `id === postId`, 構造一致 |
| 6 | `GET /posts/:postId — 存在しない ID で 404` | status 404 |
| 7 | `GET /posts/:postId — 画像付き投稿の images が createdAt ASC` | ソート順 |
| 8 | `GET /posts/:postId — 動画付き投稿の movie が非 null` | movie !== null |
| 9 | `GET /posts/:postId — 音声付き投稿の sound が非 null` | sound !== null |
| 10 | `GET /posts/:postId/comments — CommentSchema に一致` | zod parse |
| 11 | `GET /posts/:postId/comments — createdAt ASC でソート` | ソート順 |
| 12 | `GET /posts/:postId/comments — userId, postId が除外されている` | `.strict()` で検証 |

### 3-2. users.api.test.ts

| # | テスト名 | 検証内容 |
|---|---------|---------|
| 1 | `GET /users/:username — UserSchema に一致` | zod parse |
| 2 | `GET /users/:username — password が含まれない` | `.strict()` |
| 3 | `GET /users/:username — profileImageId が含まれない` | `.strict()` |
| 4 | `GET /users/:username — profileImage が含まれる` | `.profileImage !== undefined` |
| 5 | `GET /users/:username — 存在しないユーザーで 404` | status 404 |
| 6 | `GET /users/:username/posts — PostDetailSchema[] に一致` | zod parse |
| 7 | `GET /users/:username/posts — 当該ユーザーの投稿のみ返る` | 全て `userId === user.id` |
| 8 | `GET /me — 未認証で 401` | status 401 |
| 9 | `GET /me — 認証済みで UserSchema に一致` | signin → me |
| 10 | `PUT /me — プロフィール更新後の値が反映される` | update → get → 値一致 |

### 3-3. auth.api.test.ts

| # | テスト名 | 検証内容 |
|---|---------|---------|
| 1 | `POST /signup — 新規ユーザー作成 → UserSchema に一致` | zod parse, status 200 |
| 2 | `POST /signup — 作成後に /me でアクセス可能` | session 有効 |
| 3 | `POST /signup — 重複ユーザー名で { code: "USERNAME_TAKEN" }` | status 400, body 一致 |
| 4 | `POST /signup — 不正ユーザー名で { code: "INVALID_USERNAME" }` | status 400, body 一致 |
| 5 | `POST /signin — 正しいパスワードで UserSchema に一致` | zod parse |
| 6 | `POST /signin — 間違ったパスワードで 400` | status 400 |
| 7 | `POST /signin — 存在しないユーザーで 400` | status 400 |
| 8 | `POST /signout — セッション無効化 → /me が 401` | signout → me → 401 |

### 3-4. dm.api.test.ts

| # | テスト名 | 検証内容 |
|---|---------|---------|
| 1 | `GET /dm — 未認証で 401` | status 401 |
| 2 | `GET /dm — ConversationSchema[] に一致` | zod parse |
| 3 | `GET /dm — messages が空の会話は含まれない` | `.every(c => c.messages.length > 0)` |
| 4 | `GET /dm — messages が createdAt ASC でソート` | 各会話内のソート順 |
| 5 | `GET /dm — 会話が最終メッセージの createdAt DESC でソート` | 会話間のソート順 |
| 6 | `GET /dm/:id — ConversationSchema に一致` | zod parse |
| 7 | `GET /dm/:id — 他ユーザーの会話にアクセスで 404` | status 404 |
| 8 | `POST /dm — 既存会話は findOrCreate で返る` | 同じ peerId で 2 回 → 同じ id |
| 9 | `POST /dm — 存在しない peerId で 404` | status 404 |
| 10 | `POST /dm/:id/messages — DirectMessageSchema に一致` | zod parse, status 201 |
| 11 | `POST /dm/:id/messages — 空文字で 400` | status 400 |
| 12 | `POST /dm/:id/read — 既読マーク → 相手メッセージの isRead が true` | read → getDm → 検証 |
| 13 | `POST /dm/:id/typing — 200 + {}` | status 200 |

### 3-5. search.api.test.ts

| # | テスト名 | 検証内容 |
|---|---------|---------|
| 1 | `GET /search?q=写真 — PostDetailSchema[] に一致` | zod parse |
| 2 | `GET /search?q= — 空クエリで []` | `.length === 0` |
| 3 | `GET /search?q=写真&limit=3 — 3件以下` | `.length <= 3` |
| 4 | `GET /search?q=写真 since:2026-01-01 — 日付フィルタ適用` | 全て `createdAt >= 2026-01-01` |
| 5 | `GET /search?q=写真 since:2026-01-01 until:2026-01-31 — 範囲フィルタ` | 全て範囲内 |
| 6 | `GET /search?q=ユーザー名 — ユーザー名でもヒット` | 既知ユーザー名で結果あり |

### 3-6. crok.api.test.ts

| # | テスト名 | 検証内容 |
|---|---------|---------|
| 1 | `GET /crok/suggestions — SuggestionsSchema に一致` | zod parse |
| 2 | `GET /crok/suggestions — suggestions が 1 件以上` | `.length > 0` |

### 3-7. initialize.api.test.ts

| # | テスト名 | 検証内容 |
|---|---------|---------|
| 1 | `POST /initialize — 200 + {}` | status 200 |
| 2 | `POST /initialize — データがリセットされる` | signup → initialize → signin で失敗 |
| 3 | `POST /initialize — シードデータが復元される` | 既知の post が取得できる |

---

## 4. 実装計画

| Step | 作業 | 所要時間 |
|------|------|---------|
| 1 | `pnpm add -D zod` to e2e package | 2分 |
| 2 | `schemas.ts` 作成 | 15分 |
| 3 | `api-helpers.ts` 作成 | 10分 |
| 4 | `posts.api.test.ts` (12 cases) | 20分 |
| 5 | `users.api.test.ts` (10 cases) | 15分 |
| 6 | `auth.api.test.ts` (8 cases) | 15分 |
| 7 | `dm.api.test.ts` (13 cases) | 25分 |
| 8 | `search.api.test.ts` (6 cases) | 10分 |
| 9 | `crok.api.test.ts` (2 cases) | 5分 |
| 10 | `initialize.api.test.ts` (3 cases) | 10分 |
| 11 | playwright.config.ts に api project 追加 | 5分 |
| 12 | 全テスト実行 + 修正 | 15分 |

合計: 約 2.5 時間

### playwright.config.ts の変更

```typescript
projects: [
  {
    name: "API Contract",
    testMatch: "**/src/api/**/*.api.test.ts",
    use: {
      // ブラウザ不要、APIリクエストのみ
      baseURL: BASE_URL,
    },
  },
  {
    name: "Desktop Chrome",
    testMatch: "**/src/*.test.ts",  // 既存の VRT + 機能テスト
    use: {
      ...devices["Desktop Chrome"],
      ...(process.env["CHROMIUM_PATH"]
        ? { launchOptions: { executablePath: process.env["CHROMIUM_PATH"] } }
        : { channel: "chrome" }),
    },
  },
],
```

### 実行方法

```bash
# API contract テストのみ（高速、ブラウザ不要）
pnpm --filter @web-speed-hackathon-2026/e2e test -- --project="API Contract"

# 全テスト（API + VRT + 機能）
pnpm --filter @web-speed-hackathon-2026/e2e test
```

## Acceptance Criteria

- [ ] `schemas.ts` が全エンドポイントのレスポンス構造を定義
- [ ] 54 テストケースが全て PASS（現行 Sequelize 実装で）
- [ ] API contract テストがブラウザ不要で 2 分以内に完了
- [ ] ORM 移行後も全テスト PASS
- [ ] password, profileImageId が応答に含まれないことを `.strict()` で保証
- [ ] ソート順（id DESC, createdAt ASC）が全エンドポイントで検証されている

## Work Log

### 2026-03-20 - テスト設計

**By:** Claude Code

**Actions:**
- 既存 e2e テストの構成を精査（9テストファイル、VRT + 機能テスト）
- 全 API エンドポイントのレスポンス JSON 構造を実サーバーから取得・記録
- zod スキーマ設計（8スキーマ、全レスポンス構造をカバー）
- 54 テストケースを設計（contract 51 + initialize 3）
- playwright.config.ts の multi-project 構成を設計

**Learnings:**
- 既存 e2e の globalSetup が `POST /initialize` するので、API テストも同じ前提で動作する
- Playwright の `request` context を使えばブラウザなしで API テスト可能
- `.strict()` を使うと余分なキーの混入を検出でき、scope の exclude 漏れを防げる
