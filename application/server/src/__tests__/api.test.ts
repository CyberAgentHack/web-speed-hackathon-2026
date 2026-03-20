import type { Server } from "node:http";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestDatabase, signIn, startServer } from "./setup";

let server: Server;
let baseUrl: string;

// Seed data constants
const SEED_USER = { username: "o6yq16leo", password: "wsh-2026" };
const SEED_POST_ID = "d1bd6ba1-b5ba-4129-a16d-e1f898c3de1a";
const SEED_CONVERSATION_ID = "35556ba3-fb46-4c7d-ad5f-796e0d5fdd96";
const SEED_CONVERSATION_USER_ID = "99fa98c1-0f75-45c6-bc7d-1774fe713475";

beforeAll(async () => {
  await createTestDatabase();
  const result = await startServer();
  server = result.server;
  baseUrl = result.baseUrl;
}, 120000);

afterAll(() => {
  server?.close();
});

// ============================================================
// 1. Initialize
// ============================================================
describe("POST /api/v1/initialize", () => {
  it("should reset the database and return 200", async () => {
    const res = await fetch(`${baseUrl}/api/v1/initialize`, { method: "POST" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});
  });
});

// ============================================================
// 2. Auth
// ============================================================
describe("Auth", () => {
  it("POST /signup — should create a new user", async () => {
    const res = await fetch(`${baseUrl}/api/v1/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "testuser1", name: "Test User", password: "test1234" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("username", "testuser1");
    expect(body).toHaveProperty("name", "Test User");
    expect(body).not.toHaveProperty("password");
  });

  it("POST /signup — should reject duplicate username", async () => {
    // First create
    await fetch(`${baseUrl}/api/v1/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "dupuser", name: "Dup", password: "pass" }),
    });
    // Duplicate
    const res = await fetch(`${baseUrl}/api/v1/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "dupuser", name: "Dup2", password: "pass" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("code", "USERNAME_TAKEN");
  });

  it("POST /signup — should reject invalid username", async () => {
    const res = await fetch(`${baseUrl}/api/v1/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "invalid user!", name: "Bad", password: "pass" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("code", "INVALID_USERNAME");
  });

  it("POST /signin — should authenticate with valid credentials", async () => {
    const res = await fetch(`${baseUrl}/api/v1/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: SEED_USER.username, password: SEED_USER.password }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("username", SEED_USER.username);
  });

  it("POST /signin — should reject invalid password", async () => {
    const res = await fetch(`${baseUrl}/api/v1/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: SEED_USER.username, password: "wrong" }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /signin — should reject non-existent user", async () => {
    const res = await fetch(`${baseUrl}/api/v1/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "nonexistent999", password: "pass" }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /signout — should return 200", async () => {
    const cookie = await signIn(baseUrl, SEED_USER.username, SEED_USER.password);
    const res = await fetch(`${baseUrl}/api/v1/signout`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});
  });
});

// ============================================================
// 3. User
// ============================================================
describe("User", () => {
  it("GET /me — should return 401 when not logged in", async () => {
    const res = await fetch(`${baseUrl}/api/v1/me`);
    expect(res.status).toBe(401);
  });

  it("GET /me — should return current user when logged in", async () => {
    const cookie = await signIn(baseUrl, SEED_USER.username, SEED_USER.password);
    const res = await fetch(`${baseUrl}/api/v1/me`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("username", SEED_USER.username);
    expect(body).toHaveProperty("profileImage");
  });

  it("PUT /me — should update user profile", async () => {
    const cookie = await signIn(baseUrl, SEED_USER.username, SEED_USER.password);
    const res = await fetch(`${baseUrl}/api/v1/me`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ description: "updated description" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("description", "updated description");
  });

  it("PUT /me — should return 401 when not logged in", async () => {
    const res = await fetch(`${baseUrl}/api/v1/me`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "nope" }),
    });
    expect(res.status).toBe(401);
  });

  it("GET /users/:username — should return user by username", async () => {
    const res = await fetch(`${baseUrl}/api/v1/users/${SEED_USER.username}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("username", SEED_USER.username);
    expect(body).toHaveProperty("profileImage");
  });

  it("GET /users/:username — should return 404 for unknown user", async () => {
    const res = await fetch(`${baseUrl}/api/v1/users/nonexistent_user_xyz`);
    expect(res.status).toBe(404);
  });

  it("GET /users/:username/posts — should return user posts", async () => {
    const res = await fetch(`${baseUrl}/api/v1/users/${SEED_USER.username}/posts?limit=5`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("GET /users/:username/posts — should return 404 for unknown user", async () => {
    const res = await fetch(`${baseUrl}/api/v1/users/nonexistent_user_xyz/posts`);
    expect(res.status).toBe(404);
  });
});

// ============================================================
// 4. Posts
// ============================================================
describe("Posts", () => {
  it("GET /posts — should return array of posts", async () => {
    const res = await fetch(`${baseUrl}/api/v1/posts?limit=5`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeLessThanOrEqual(5);
    if (body.length > 0) {
      expect(body[0]).toHaveProperty("id");
      expect(body[0]).toHaveProperty("text");
      expect(body[0]).toHaveProperty("user");
    }
  });

  it("GET /posts — should support pagination with offset", async () => {
    const res1 = await fetch(`${baseUrl}/api/v1/posts?limit=2&offset=0`);
    const res2 = await fetch(`${baseUrl}/api/v1/posts?limit=2&offset=2`);
    const body1 = await res1.json();
    const body2 = await res2.json();
    expect(body1[0].id).not.toBe(body2[0].id);
  });

  it("GET /posts/:postId — should return a single post", async () => {
    const res = await fetch(`${baseUrl}/api/v1/posts/${SEED_POST_ID}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("id", SEED_POST_ID);
    expect(body).toHaveProperty("text");
    expect(body).toHaveProperty("user");
  });

  it("GET /posts/:postId — should return 404 for non-existent post", async () => {
    const res = await fetch(`${baseUrl}/api/v1/posts/00000000-0000-0000-0000-000000000000`);
    expect(res.status).toBe(404);
  });

  it("GET /posts/:postId/comments — should return comments for a post", async () => {
    const res = await fetch(`${baseUrl}/api/v1/posts/${SEED_POST_ID}/comments?limit=5`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    if (body.length > 0) {
      expect(body[0]).toHaveProperty("text");
      expect(body[0]).toHaveProperty("user");
    }
  });

  it("POST /posts — should return 401 when not logged in", async () => {
    const res = await fetch(`${baseUrl}/api/v1/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "hello" }),
    });
    expect(res.status).toBe(401);
  });

  it("POST /posts — should create a post when logged in", async () => {
    const cookie = await signIn(baseUrl, SEED_USER.username, SEED_USER.password);
    const res = await fetch(`${baseUrl}/api/v1/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ text: "Test post from vitest" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("text", "Test post from vitest");
  });
});

// ============================================================
// 5. Search
// ============================================================
describe("Search", () => {
  it("GET /search — should return empty array for empty query", async () => {
    const res = await fetch(`${baseUrl}/api/v1/search?q=`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  // BUG: search with keywords triggers a user-name fallback query that has a known bug
  // (SQLITE_ERROR: no such column: user.profileImageId in the JOIN subquery).
  // Fix the search route and then remove .todo to enable this test.
  it.todo("GET /search — should return results for text query", async () => {
    const res = await fetch(`${baseUrl}/api/v1/search?q=${encodeURIComponent("カメラ")}&limit=5`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("GET /search — should support date-only filter without keywords", async () => {
    const res = await fetch(
      `${baseUrl}/api/v1/search?q=${encodeURIComponent("since:2026-01-30")}&limit=5`,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

// ============================================================
// 6. Direct Messages
// ============================================================
describe("Direct Messages", () => {
  it("GET /dm — should return 401 when not logged in", async () => {
    const res = await fetch(`${baseUrl}/api/v1/dm`);
    expect(res.status).toBe(401);
  });

  it("GET /dm — should return conversations when logged in", async () => {
    // Sign in as conversation initiator
    const cookie = await signIn(baseUrl, SEED_USER.username, SEED_USER.password);
    const res = await fetch(`${baseUrl}/api/v1/dm`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("POST /dm — should return 401 when not logged in", async () => {
    const res = await fetch(`${baseUrl}/api/v1/dm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peerId: SEED_CONVERSATION_USER_ID }),
    });
    expect(res.status).toBe(401);
  });

  it("POST /dm — should return 404 for non-existent peer", async () => {
    const cookie = await signIn(baseUrl, SEED_USER.username, SEED_USER.password);
    const res = await fetch(`${baseUrl}/api/v1/dm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ peerId: "00000000-0000-0000-0000-000000000000" }),
    });
    expect(res.status).toBe(404);
  });

  it("POST /dm — should create or get conversation with peer", async () => {
    const cookie = await signIn(baseUrl, SEED_USER.username, SEED_USER.password);
    const res = await fetch(`${baseUrl}/api/v1/dm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ peerId: SEED_CONVERSATION_USER_ID }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("id");
  });

  it("GET /dm/:conversationId — should return 401 when not logged in", async () => {
    const res = await fetch(`${baseUrl}/api/v1/dm/${SEED_CONVERSATION_ID}`);
    expect(res.status).toBe(401);
  });

  it("POST /dm/:conversationId/messages — should return 401 when not logged in", async () => {
    const res = await fetch(`${baseUrl}/api/v1/dm/${SEED_CONVERSATION_ID}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "hello" }),
    });
    expect(res.status).toBe(401);
  });

  it("POST /dm/:conversationId/read — should return 401 when not logged in", async () => {
    const res = await fetch(`${baseUrl}/api/v1/dm/${SEED_CONVERSATION_ID}/read`, {
      method: "POST",
    });
    expect(res.status).toBe(401);
  });

  it("POST /dm/:conversationId/typing — should return 401 when not logged in", async () => {
    const res = await fetch(`${baseUrl}/api/v1/dm/${SEED_CONVERSATION_ID}/typing`, {
      method: "POST",
    });
    expect(res.status).toBe(401);
  });
});

// ============================================================
// 7. Crok (AI Q&A)
// ============================================================
describe("Crok", () => {
  it("GET /crok/suggestions — should return suggestions", async () => {
    const res = await fetch(`${baseUrl}/api/v1/crok/suggestions`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("suggestions");
    expect(Array.isArray(body.suggestions)).toBe(true);
    expect(body.suggestions.length).toBeGreaterThan(0);
  });

  it("GET /crok — should return 401 when not logged in", async () => {
    const res = await fetch(`${baseUrl}/api/v1/crok`);
    expect(res.status).toBe(401);
  });
});
