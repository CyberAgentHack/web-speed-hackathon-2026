import { describe, expect, test } from "vitest";

import { app, routesReady } from "../../app";

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
});
