---
status: ready
priority: p1
issue_id: "008"
tags: [server, framework, hono, performance, migration]
dependencies: []
---

# Phase 1: Express → Hono 移行

## Problem Statement

Express 5 + 多数のミドルウェア (body-parser, compression, serve-static, connect-history-api-fallback, http-errors, express-session) がサーバー起動速度・ルーティング速度・依存数に悪影響。Hono に置き換えることで依存削減・TTFB 改善・Phase 3 (Bun移行) への布石とする。

## Findings

- サーバー全17ファイルが Express に依存
- セッションは `{ userId: string }` を MemoryStore に入れているだけ → 自前 cookie+Map で 20行で代替可能
- WebSocket は Express を monkey-patch した独自 `.ws()` メソッド → `@hono/node-ws` で代替
- `upgradeWebSocket` は `Upgrade: websocket` ヘッダーで判定、非WS リクエストはスルー → 同一パスで HTTP GET と WebSocket が共存可能
- クライアントの WS 接続先: `/api/v1/dm/unread`, `/api/v1/dm/:conversationId` (サフィックスなし)
- SSE (crok.ts) は `streamSSE` + `writeSSE` で同等プロトコル出力可能
- リスク項目は全て解消済み

## Recommended Action

### Step 0: パッケージ追加
- `pnpm add hono @hono/node-server @hono/node-ws`

### Step 1: コア基盤 (app.ts, index.ts, session.ts)

**session.ts** — 自前実装 (hono-session は使わない)
```typescript
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { v4 as uuidv4 } from "uuid";

type SessionData = { userId: string };
export const sessionStore = new Map<string, SessionData>();

export const sessionMiddleware = createMiddleware(async (c, next) => {
  const sid = getCookie(c, "sid") ?? uuidv4();
  setCookie(c, "sid", sid, { httpOnly: true, path: "/" });
  c.set("session", {
    get: () => sessionStore.get(sid),
    set: (data: SessionData) => sessionStore.set(sid, data),
    delete: () => { sessionStore.delete(sid); deleteCookie(c, "sid"); },
  });
  await next();
});
```

**app.ts** — Hono app 初期化
```typescript
import { Hono } from "hono";
import { compress } from "hono/compress";
export const app = new Hono();
app.use(compress());
app.use("*", sessionMiddleware);
app.route("/api/v1", apiRouter);
```

**index.ts** — サーバー起動
```typescript
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
export const { upgradeWebSocket, injectWebSocket } = createNodeWebSocket({ app });
const server = serve({ fetch: app.fetch, port: 3000, hostname: "0.0.0.0" });
injectWebSocket(server);
```

- `express_websocket_support.ts` 削除
- 検証: サーバー起動確認

### Step 2: auth.ts — session パターン確立

変換パターン:
- `req.body` → `await c.req.json()`
- `req.session.userId = id` → `c.var.session.set({ userId: id })`
- `req.session.userId = undefined` → `c.var.session.delete()`
- `throw new httpErrors.Unauthorized()` → `throw new HTTPException(401)`
- `res.status(200).type("application/json").send(data)` → `return c.json(data)`

検証: signup → signin → signout → signin フロー

### Step 3: CRUD 7ファイル (機械的変換)

対象: user.ts, post.ts, search.ts, image.ts, movie.ts, sound.ts, initialize.ts

変換パターン:
- `Router()` → `new Hono()`
- `req.params.xxx` → `c.req.param("xxx")`
- `req.query["xxx"]` → `c.req.query("xxx")`
- `req.body` (JSON) → `await c.req.json()`
- `req.body` (Buffer) → `Buffer.from(await c.req.arrayBuffer())`
- `req.session.userId` → `c.var.session.get()?.userId`
- `throw new httpErrors.*()` → `throw new HTTPException(status)`
- `res.status(N).type("application/json").send(x)` → `return c.json(x, N)`

upload 系 (image, movie, sound) に `bodyLimit({ maxSize: 10 * 1024 * 1024 })` を設定

### Step 4: SSE (crok.ts)

```typescript
import { streamSSE } from "hono/streaming";
crokRouter.get("/crok", async (c) => {
  const userId = c.var.session.get()?.userId;
  if (!userId) throw new HTTPException(401);
  c.header("Connection", "keep-alive");
  return streamSSE(c, async (stream) => {
    let messageId = 0;
    await stream.sleep(3000);
    for (const char of response) {
      if (stream.aborted) break;
      await stream.writeSSE({
        event: "message",
        id: String(messageId++),
        data: JSON.stringify({ text: char, done: false }),
      });
      await stream.sleep(10);
    }
    if (!stream.aborted) {
      await stream.writeSSE({
        event: "message",
        id: String(messageId),
        data: JSON.stringify({ text: "", done: true }),
      });
    }
  });
});
```

### Step 5: WebSocket (direct_message.ts)

同一パスで HTTP GET と WebSocket を共存:
```typescript
directMessageRouter.get(
  "/dm/:conversationId",
  upgradeWebSocket(async (c) => {
    // WebSocket upgrade 時のみ実行
    return { onOpen, onClose };
  }),
  async (c) => {
    // 通常の HTTP GET
    return c.json(conversation);
  }
);
```

EventEmitter パターン (eventhub) はそのまま維持。

### Step 6: 静的ファイル配信 + 画像最適化

- `@hono/node-server/serve-static` で3層キャッシュ (upload:1d, public:1d, dist:1y immutable)
- SPA fallback: GET + Accept:text/html + パスに`.`なし + `/api/`で始まらない
- 画像WebP変換: sharp + Map キャッシュをそのまま Hono ミドルウェアに移植

### Step 7: エラーハンドリング + クリーンアップ

```typescript
apiRouter.onError((err, c) => {
  if (err instanceof ValidationError) return c.json({ message: "Bad Request" }, 400);
  if (err instanceof HTTPException) return c.json({ message: err.message }, err.status);
  console.error(err);
  return c.json({ message: err.message }, 500);
});
```

Express 関連パッケージ全削除:
```bash
pnpm remove express @types/express express-session @types/express-session \
  body-parser @types/body-parser compression @types/compression \
  serve-static @types/serve-static connect-history-api-fallback \
  @types/connect-history-api-fallback http-errors @types/http-errors
```

### Step 8: VRT + 手動テスト

重点確認: 認証フロー, DM (WebSocket), Crok (SSE), ファイルアップロード, 検索, SPA ルーティング, 画像 WebP 変換

## Acceptance Criteria

- [ ] Express 関連パッケージが package.json に残っていない
- [ ] import に `express` が残っていない
- [ ] `express_websocket_support.ts` が削除されている
- [ ] VRT が全て通る
- [ ] 手動テスト項目 (docs/test_cases.md) が全て通る
- [ ] signup → signin → signout → signin が動く
- [ ] DM 未読数リアルタイム更新が動く
- [ ] DM メッセージ送受信が動く
- [ ] DM タイピング通知が動く
- [ ] Crok SSE ストリーミングが動く
- [ ] 画像/動画/音声アップロードが動く
- [ ] SPA ルーティング (直接URLアクセス) が動く
- [ ] 画像 WebP 変換が動く
- [ ] POST /api/v1/initialize でDB+セッション+アップロードがリセットされる

## Work Log

### 2026-03-20 - 計画策定

**By:** Claude Code

**Actions:**
- Express 使用状況の全ファイル調査 (17ファイル)
- hono-session の調査 → 自前実装に決定 (リスク排除)
- @hono/node-ws のソースコード調査 → upgradeWebSocket の挙動確認
- クライアントの WebSocket 接続パス確認 (サフィックスなし)
- リスク10項目の洗い出しと全項目の解消策確定

**Learnings:**
- hono-session は jose 依存で過剰。セッションが単純なら自前 cookie+Map が最適
- upgradeWebSocket は Upgrade ヘッダーで判定し、非WS はスルーするため同一パス共存可能
- Express の monkey-patch WS は内部で /ws サフィックスを付けるがクライアントは素のパスで接続
