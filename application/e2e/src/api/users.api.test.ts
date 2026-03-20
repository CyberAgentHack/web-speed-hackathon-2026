import { expect, test } from "@playwright/test";
import * as v from "valibot";

import { ApiClient } from "./api-helpers";
import { PostDetailSchema, UserSchema } from "./schemas";

const KNOWN_USERNAME = "o6yq16leo";
const KNOWN_PASSWORD = "wsh-2026";

test.describe("GET /users/:username", () => {
  test("UserSchema に一致する", async ({ request }) => {
    const api = new ApiClient(request);
    const res = await api.getUser(KNOWN_USERNAME);
    expect(res.status()).toBe(200);

    const user = await res.json();
    expect(() => v.parse(UserSchema, user)).not.toThrow();
  });

  test("password が含まれない", async ({ request }) => {
    const api = new ApiClient(request);
    const user = await (await api.getUser(KNOWN_USERNAME)).json();
    expect(user).not.toHaveProperty("password");
  });

  test("profileImageId が含まれない", async ({ request }) => {
    const api = new ApiClient(request);
    const user = await (await api.getUser(KNOWN_USERNAME)).json();
    expect(user).not.toHaveProperty("profileImageId");
  });

  test("profileImage が含まれる", async ({ request }) => {
    const api = new ApiClient(request);
    const user = await (await api.getUser(KNOWN_USERNAME)).json();
    expect(user.profileImage).toBeDefined();
    expect(user.profileImage.id).toBeTruthy();
  });

  test("存在しないユーザーで 404", async ({ request }) => {
    const api = new ApiClient(request);
    const res = await api.getUser("nonexistent_user_12345");
    expect(res.status()).toBe(404);
  });
});

test.describe("GET /users/:username/posts", () => {
  test("PostDetailSchema[] に一致する", async ({ request }) => {
    const api = new ApiClient(request);
    const res = await api.getUserPosts(KNOWN_USERNAME, { limit: 3 });
    expect(res.status()).toBe(200);

    const posts = await res.json();
    for (const post of posts) {
      expect(() => v.parse(PostDetailSchema, post)).not.toThrow();
    }
  });

  test("当該ユーザーの投稿のみ返る", async ({ request }) => {
    const api = new ApiClient(request);
    const user = await (await api.getUser(KNOWN_USERNAME)).json();
    const posts = await (await api.getUserPosts(KNOWN_USERNAME, { limit: 10 })).json();

    for (const post of posts) {
      expect(post.userId).toBe(user.id);
    }
  });
});

test.describe("GET /me", () => {
  test("未認証で 401", async ({ request }) => {
    const api = new ApiClient(request);
    const res = await api.me();
    expect(res.status()).toBe(401);
  });

  test("認証済みで UserSchema に一致する", async ({ request }) => {
    const api = new ApiClient(request);
    await api.signin({ username: KNOWN_USERNAME, password: KNOWN_PASSWORD });

    const res = await api.me();
    expect(res.status()).toBe(200);

    const user = await res.json();
    expect(() => v.parse(UserSchema, user)).not.toThrow();
    expect(user.username).toBe(KNOWN_USERNAME);
  });
});

test.describe("PUT /me", () => {
  test("プロフィール更新後の値が反映される", async ({ request }) => {
    const api = new ApiClient(request);
    await api.signin({ username: KNOWN_USERNAME, password: KNOWN_PASSWORD });

    const newDesc = `test-${Date.now()}`;
    const updateRes = await api.updateMe({ description: newDesc });
    expect(updateRes.status()).toBe(200);

    const user = await (await api.me()).json();
    expect(user.description).toBe(newDesc);
  });
});
