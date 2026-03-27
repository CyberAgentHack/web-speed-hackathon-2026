import { describe, test, expect } from "bun:test";

import { app } from "../app";
import { setupApiTestFile } from "../setup_utils";
import { signupAndGetCookie, requestWithSession } from "../helpers";

setupApiTestFile();

describe("GET /api/v1/posts", () => {
  test("returns 200 with array", async () => {
    const res = await app.request("/api/v1/posts");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("respects limit and offset", async () => {
    const res = await app.request("/api/v1/posts?limit=2&offset=0");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBeLessThanOrEqual(2);
  });
});

describe("GET /api/v1/posts/:postId", () => {
  test("returns 200 for existing post", async () => {
    const { cookie } = await signupAndGetCookie(app, "post_get_user", "pass123");
    const createRes = await requestWithSession(app, "POST", "/api/v1/posts", cookie, {
      text: "Test post for get",
    });
    const created = await createRes.json();

    const res = await app.request(`/api/v1/posts/${created.id}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(created.id);
  });

  test("returns 404 for non-existent post", async () => {
    const res = await app.request("/api/v1/posts/00000000-0000-0000-0000-000000000000");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/v1/posts/:postId/comments", () => {
  test("returns 200 with array", async () => {
    const { cookie } = await signupAndGetCookie(app, "post_comments_user", "pass123");
    const createRes = await requestWithSession(app, "POST", "/api/v1/posts", cookie, {
      text: "Post with comments",
    });
    const created = await createRes.json();

    const res = await app.request(`/api/v1/posts/${created.id}/comments`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("returns 200 with empty array for non-existent post", async () => {
    const res = await app.request("/api/v1/posts/00000000-0000-0000-0000-000000000000/comments");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});

describe("POST /api/v1/posts", () => {
  test("returns 401 when not authenticated", async () => {
    const res = await app.request("/api/v1/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Unauthorized post" }),
    });
    expect(res.status).toBe(401);
  });

  test("returns 200 with created post when authenticated", async () => {
    const { cookie } = await signupAndGetCookie(app, "post_create_user", "pass123");
    const res = await requestWithSession(app, "POST", "/api/v1/posts", cookie, {
      text: "My new post",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.text).toBe("My new post");
  });
});
