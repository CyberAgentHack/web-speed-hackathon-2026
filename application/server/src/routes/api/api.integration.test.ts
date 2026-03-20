import { describe, expect, test } from "bun:test";

import { app, routesReady } from "../../app";

// Helper: sign in and return the session cookie string
async function getAuthCookie(username = "o6yq16leo", password = "wsh-2026"): Promise<string> {
  const res = await app.request("/api/v1/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.headers.get("set-cookie")?.split(";")[0] ?? "";
}

describe("API Integration Tests", () => {
  // Ensure routes are registered before any test runs
  test("routes are registered", async () => {
    await routesReady;
  });

  describe("POST /api/v1/initialize", () => {
    test("DB リセットが成功し 200 を返す", async () => {
      await routesReady;
      const res = await app.request("/api/v1/initialize", { method: "POST" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({});
    });
  });

  describe("GET /api/v1/posts", () => {
    test("投稿一覧が配列で返る", async () => {
      await routesReady;
      const res = await app.request("/api/v1/posts?limit=5");
      expect(res.status).toBe(200);
      const posts = await res.json();
      expect(Array.isArray(posts)).toBe(true);
      expect(posts.length).toBeGreaterThan(0);
      expect(posts.length).toBeLessThanOrEqual(5);
    });

    test("各投稿に id, text, user が含まれる", async () => {
      await routesReady;
      const res = await app.request("/api/v1/posts?limit=1");
      const [post] = await res.json();
      expect(post).toHaveProperty("id");
      expect(post).toHaveProperty("text");
      expect(post).toHaveProperty("user");
    });
  });

  describe("GET /api/v1/posts/:postId", () => {
    test("存在する投稿 → 200 + 投稿データ", async () => {
      await routesReady;
      // まず投稿一覧から ID を取得
      const listRes = await app.request("/api/v1/posts?limit=1");
      const [first] = await listRes.json();

      const res = await app.request(`/api/v1/posts/${first.id}`);
      expect(res.status).toBe(200);
      const post = await res.json();
      expect(post.id).toBe(first.id);
    });

    test("存在しない投稿 → 404", async () => {
      await routesReady;
      const res = await app.request("/api/v1/posts/nonexistent-id-999");
      expect(res.status).toBe(404);
    });
  });

  describe("Auth flow (signup → signin → signout)", () => {
    const testUser = {
      username: "testuser_integration",
      password: "TestPass123!",
      name: "Test User",
    };

    test("signup → 新規ユーザー作成、ユーザー情報が返る", async () => {
      await routesReady;
      const res = await app.request("/api/v1/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser),
      });
      expect(res.status).toBe(200);
      const user = await res.json();
      expect(user.username).toBe(testUser.username);
      expect(user.name).toBe(testUser.name);
      // パスワードが返されないこと
      expect(user).not.toHaveProperty("password");
    });

    test("signup → 同じ username で再登録すると 400", async () => {
      await routesReady;
      const res = await app.request("/api/v1/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser),
      });
      expect(res.status).toBe(400);
    });

    test("signin → 正しい認証情報でログイン成功", async () => {
      await routesReady;
      const res = await app.request("/api/v1/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: testUser.username,
          password: testUser.password,
        }),
      });
      expect(res.status).toBe(200);
      const user = await res.json();
      expect(user.username).toBe(testUser.username);
    });

    test("signin → 間違ったパスワードで 400", async () => {
      await routesReady;
      const res = await app.request("/api/v1/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: testUser.username,
          password: "wrong-password",
        }),
      });
      expect(res.status).toBe(400);
    });

    test("signin → 存在しないユーザーで 400", async () => {
      await routesReady;
      const res = await app.request("/api/v1/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "nonexistent_user_xyz",
          password: "any",
        }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/search", () => {
    test("q パラメータなし → 空配列", async () => {
      await routesReady;
      const res = await app.request("/api/v1/search");
      expect(res.status).toBe(200);
      const results = await res.json();
      expect(results).toEqual([]);
    });

    test("空文字列 → 空配列", async () => {
      await routesReady;
      const res = await app.request("/api/v1/search?q=");
      expect(res.status).toBe(200);
      const results = await res.json();
      expect(results).toEqual([]);
    });

    test("キーワード検索 → 結果が配列で返る", async () => {
      await routesReady;
      // seed データに含まれるであろうテキストで検索
      const res = await app.request("/api/v1/search?q=メロス&limit=5");
      expect(res.status).toBe(200);
      const results = await res.json();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  // =====================================================
  // User API
  // =====================================================
  describe("User API", () => {
    test("GET /api/v1/me (unauthorized) → 401", async () => {
      await routesReady;
      const res = await app.request("/api/v1/me");
      expect(res.status).toBe(401);
    });

    test("GET /api/v1/me (authorized) → user data with profileImage", async () => {
      await routesReady;
      const cookie = await getAuthCookie();
      const res = await app.request("/api/v1/me", {
        headers: { Cookie: cookie },
      });
      expect(res.status).toBe(200);
      const user = await res.json();
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("username");
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("profileImage");
    });

    test("PUT /api/v1/me (update name) → 200 + updated name", async () => {
      await routesReady;
      const cookie = await getAuthCookie();
      const newName = "Updated Name " + Date.now();
      const res = await app.request("/api/v1/me", {
        method: "PUT",
        headers: { Cookie: cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      expect(res.status).toBe(200);
      const user = await res.json();
      expect(user.name).toBe(newName);
    });

    test("PUT /api/v1/me (unauthorized) → 401", async () => {
      await routesReady;
      const res = await app.request("/api/v1/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Should Fail" }),
      });
      expect(res.status).toBe(401);
    });

    test("GET /api/v1/users/:username (existing) → 200 + user data", async () => {
      await routesReady;
      const res = await app.request("/api/v1/users/o6yq16leo");
      expect(res.status).toBe(200);
      const user = await res.json();
      expect(user).toHaveProperty("id");
      expect(user.username).toBe("o6yq16leo");
      expect(user).toHaveProperty("profileImage");
    });

    test("GET /api/v1/users/:username (nonexistent) → 404", async () => {
      await routesReady;
      const res = await app.request("/api/v1/users/nonexistent_user_xyz_999");
      expect(res.status).toBe(404);
    });

    test("GET /api/v1/users/:username/posts → returns array of posts", async () => {
      await routesReady;
      const res = await app.request("/api/v1/users/o6yq16leo/posts?limit=5");
      expect(res.status).toBe(200);
      const posts = await res.json();
      expect(Array.isArray(posts)).toBe(true);
    });
  });

  // =====================================================
  // Post detail
  // =====================================================
  describe("Post detail", () => {
    test("GET /api/v1/posts/:postId → response has user, images, movie, sound fields", async () => {
      await routesReady;
      const listRes = await app.request("/api/v1/posts?limit=1");
      const [first] = await listRes.json();

      const res = await app.request(`/api/v1/posts/${first.id}`);
      expect(res.status).toBe(200);
      const post = await res.json();
      expect(post).toHaveProperty("user");
      expect(post).toHaveProperty("images");
      expect(post).toHaveProperty("movie");
      expect(post).toHaveProperty("sound");
    });

    test("GET /api/v1/posts/:postId/comments → returns array", async () => {
      await routesReady;
      const listRes = await app.request("/api/v1/posts?limit=1");
      const [first] = await listRes.json();

      const res = await app.request(`/api/v1/posts/${first.id}/comments`);
      expect(res.status).toBe(200);
      const comments = await res.json();
      expect(Array.isArray(comments)).toBe(true);
    });
  });

  // =====================================================
  // DM API
  // =====================================================
  describe("DM API", () => {
    test("GET /api/v1/dm (unauthorized) → 401", async () => {
      await routesReady;
      const res = await app.request("/api/v1/dm");
      expect(res.status).toBe(401);
    });

    test("GET /api/v1/dm (authorized) → array of conversations", async () => {
      await routesReady;
      const cookie = await getAuthCookie();
      const res = await app.request("/api/v1/dm", {
        headers: { Cookie: cookie },
      });
      expect(res.status).toBe(200);
      const conversations = await res.json();
      expect(Array.isArray(conversations)).toBe(true);
    });

    test("POST /api/v1/dm → create conversation with peerId", async () => {
      await routesReady;
      const cookie = await getAuthCookie();
      // User B id
      const peerId = "ae8a99ad-1c33-491e-8ab0-9822b5b86ed5";
      const res = await app.request("/api/v1/dm", {
        method: "POST",
        headers: { Cookie: cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ peerId }),
      });
      expect(res.status).toBe(200);
      const conversation = await res.json();
      expect(conversation).toHaveProperty("id");
    });

    test("POST /api/v1/dm/:conversationId/messages → send message 201", async () => {
      await routesReady;
      const cookie = await getAuthCookie();
      // Create or get conversation first
      const peerId = "ae8a99ad-1c33-491e-8ab0-9822b5b86ed5";
      const convRes = await app.request("/api/v1/dm", {
        method: "POST",
        headers: { Cookie: cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ peerId }),
      });
      const conversation = await convRes.json();

      const res = await app.request(`/api/v1/dm/${conversation.id}/messages`, {
        method: "POST",
        headers: { Cookie: cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ body: "Hello from integration test!" }),
      });
      expect(res.status).toBe(201);
      const message = await res.json();
      expect(message).toHaveProperty("id");
      expect(message.body).toBe("Hello from integration test!");
    });

    // NOTE: GET /api/v1/dm/:conversationId is skipped because the WebSocket
    // upgradeWebSocket handler for the same path intercepts the request in
    // app.request() tests (no real Bun server), causing c.env to be undefined.

    test("POST /api/v1/dm/:conversationId/read → mark as read 200", async () => {
      await routesReady;
      const cookie = await getAuthCookie();
      // Create or get conversation
      const peerId = "ae8a99ad-1c33-491e-8ab0-9822b5b86ed5";
      const convRes = await app.request("/api/v1/dm", {
        method: "POST",
        headers: { Cookie: cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ peerId }),
      });
      const conversation = await convRes.json();

      const res = await app.request(`/api/v1/dm/${conversation.id}/read`, {
        method: "POST",
        headers: { Cookie: cookie },
      });
      expect(res.status).toBe(200);
    });
  });

  // =====================================================
  // Crok API
  // =====================================================
  describe("Crok API", () => {
    test("GET /api/v1/crok/suggestions → returns suggestions array", async () => {
      await routesReady;
      const res = await app.request("/api/v1/crok/suggestions");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("suggestions");
      expect(Array.isArray(body.suggestions)).toBe(true);
    });
  });

  // =====================================================
  // Brotli compression
  // =====================================================
  describe("Brotli compression", () => {
    test("Accept-Encoding: br → Content-Encoding: br header", async () => {
      await routesReady;
      const res = await app.request("/api/v1/posts?limit=30", {
        headers: { "Accept-Encoding": "br" },
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Encoding")).toBe("br");
    });

    test("No Accept-Encoding → no Content-Encoding header", async () => {
      await routesReady;
      const res = await app.request("/api/v1/posts?limit=30");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Encoding")).toBeNull();
    });
  });

  // =====================================================
  // Image optimization
  // =====================================================
  describe("Image optimization", () => {
    const imageId = "029b4b75-bbcc-4aa5-8bd7-e4bb12a33cd3";

    test("Accept: image/avif → Content-Type: image/avif", async () => {
      await routesReady;
      const res = await app.request(`/images/${imageId}.jpg`, {
        headers: { Accept: "image/avif,image/webp,*/*" },
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("image/avif");
    });

    test("Accept: image/webp (no avif) → Content-Type: image/jpeg (fallback)", async () => {
      await routesReady;
      const res = await app.request(`/images/${imageId}.jpg`, {
        headers: { Accept: "image/webp,*/*" },
      });
      expect(res.status).toBe(200);
      // WebP support was removed; only AVIF is negotiated
      const contentType = res.headers.get("Content-Type");
      expect(contentType).toContain("image/jpeg");
    });

    test("No Accept header → Content-Type: image/jpeg", async () => {
      await routesReady;
      const res = await app.request(`/images/${imageId}.jpg`);
      expect(res.status).toBe(200);
      const contentType = res.headers.get("Content-Type");
      expect(contentType).toContain("image/jpeg");
    });
  });

  // =====================================================
  // Static files
  // =====================================================
  describe("Static files", () => {
    test("GET /fonts/ReiNoAreMincho-Heavy-subset.woff2 → 200", async () => {
      await routesReady;
      const res = await app.request("/fonts/ReiNoAreMincho-Heavy-subset.woff2");
      expect(res.status).toBe(200);
    });

    test("GET /images/icons/crok.svg → 200", async () => {
      await routesReady;
      const res = await app.request("/images/icons/crok.svg");
      expect(res.status).toBe(200);
    });

    test("GET /nonexistent-file.xyz → 404", async () => {
      await routesReady;
      const res = await app.request("/nonexistent-file.xyz");
      expect(res.status).toBe(404);
    });
  });

  // =====================================================
  // SSR
  // =====================================================
  describe("SSR", () => {
    test("GET / → 200 + contains __SSR_DATA__ and <!doctype html>", async () => {
      await routesReady;
      const res = await app.request("/");
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("__SSR_DATA__");
      expect(html).toContain("<!doctype html>");
    });

    test("GET /terms → 200 + HTML", async () => {
      await routesReady;
      const res = await app.request("/terms");
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("<!doctype html>");
    });

    test("GET /users/o6yq16leo → 200 + __SSR_DATA__ with user data", async () => {
      await routesReady;
      const res = await app.request("/users/o6yq16leo");
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("__SSR_DATA__");
      expect(html).toContain("o6yq16leo");
    });
  });
});
