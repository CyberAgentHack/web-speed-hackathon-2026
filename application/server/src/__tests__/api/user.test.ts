import { describe, test, expect } from "bun:test";

import { app } from "../app";
import { setupApiTestFile } from "../setup_utils";
import { signupAndGetCookie, requestWithSession } from "../helpers";

setupApiTestFile();

describe("GET /api/v1/me", () => {
  test("returns 401 when not authenticated", async () => {
    const res = await app.request("/api/v1/me");
    expect(res.status).toBe(401);
  });

  test("does not set a session cookie when not authenticated", async () => {
    const res = await app.request("/api/v1/me");
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  test("returns 200 with user JSON when authenticated", async () => {
    const { cookie } = await signupAndGetCookie(app, "user_me_ok", "pass123");
    const res = await app.request("/api/v1/me", {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    const body = await res.json();
    expect(body.username).toBe("user_me_ok");
  });
});

describe("PUT /api/v1/me", () => {
  test("returns 401 when not authenticated", async () => {
    const res = await app.request("/api/v1/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated Name" }),
    });
    expect(res.status).toBe(401);
  });

  test("returns 200 with updated user when authenticated", async () => {
    const { cookie } = await signupAndGetCookie(app, "user_put_ok", "pass123");
    const res = await requestWithSession(app, "PUT", "/api/v1/me", cookie, {
      name: "Updated Name",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Updated Name");
  });
});

describe("GET /api/v1/users/:username", () => {
  test("returns 200 for existing user", async () => {
    await signupAndGetCookie(app, "user_get_exists", "pass123");
    const res = await app.request("/api/v1/users/user_get_exists");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    const body = await res.json();
    expect(body.username).toBe("user_get_exists");
  });

  test("returns 404 for non-existent user", async () => {
    const res = await app.request("/api/v1/users/nonexistent_user_xyz");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/v1/users/:username/posts", () => {
  test("returns 200 with posts array", async () => {
    await signupAndGetCookie(app, "user_posts_list", "pass123");
    const res = await app.request("/api/v1/users/user_posts_list/posts");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("respects limit parameter", async () => {
    const { cookie } = await signupAndGetCookie(app, "user_posts_limit", "pass123");

    // Create a couple posts
    await requestWithSession(app, "POST", "/api/v1/posts", cookie, { text: "Post 1" });
    await requestWithSession(app, "POST", "/api/v1/posts", cookie, { text: "Post 2" });

    const res = await app.request("/api/v1/users/user_posts_limit/posts?limit=1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBeLessThanOrEqual(1);
  });
});
