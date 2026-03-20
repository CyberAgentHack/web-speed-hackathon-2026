import { expect, test } from "@playwright/test";
import * as v from "valibot";

import { ApiClient } from "./api-helpers";
import { AuthErrorSchema, UserSchema } from "./schemas";

test.describe("POST /signup", () => {
  test("新規ユーザー作成 → UserSchema に一致", async ({ request }) => {
    const api = new ApiClient(request);
    const username = `test_${Date.now().toString(36)}`;
    const res = await api.signup({ username, name: "Test User", password: "testpass123" });
    expect(res.status()).toBe(200);

    const user = await res.json();
    expect(() => v.parse(UserSchema, user)).not.toThrow();
    expect(user.username).toBe(username);
  });

  test("作成後に /me でアクセス可能", async ({ request }) => {
    const api = new ApiClient(request);
    const username = `test_${Date.now().toString(36)}_me`;
    await api.signup({ username, name: "Test", password: "testpass123" });

    const meRes = await api.me();
    expect(meRes.status()).toBe(200);

    const me = await meRes.json();
    expect(me.username).toBe(username);
  });

  test("重複ユーザー名で { code: 'USERNAME_TAKEN' }", async ({ request }) => {
    const api = new ApiClient(request);
    const res = await api.signup({ username: "o6yq16leo", name: "Dup", password: "testpass123" });
    expect(res.status()).toBe(400);

    const body = await res.json();
    expect(() => v.parse(AuthErrorSchema, body)).not.toThrow();
    expect(body.code).toBe("USERNAME_TAKEN");
  });

  test("不正ユーザー名で { code: 'INVALID_USERNAME' }", async ({ request }) => {
    const api = new ApiClient(request);
    const res = await api.signup({
      username: "test user!",
      name: "Invalid",
      password: "testpass123",
    });
    expect(res.status()).toBe(400);

    const body = await res.json();
    expect(() => v.parse(AuthErrorSchema, body)).not.toThrow();
    expect(body.code).toBe("INVALID_USERNAME");
  });
});

test.describe("POST /signin", () => {
  test("正しいパスワードで UserSchema に一致", async ({ request }) => {
    const api = new ApiClient(request);
    const res = await api.signin({ username: "o6yq16leo", password: "wsh-2026" });
    expect(res.status()).toBe(200);

    const user = await res.json();
    expect(() => v.parse(UserSchema, user)).not.toThrow();
  });

  test("間違ったパスワードで 400", async ({ request }) => {
    const api = new ApiClient(request);
    const res = await api.signin({ username: "o6yq16leo", password: "wrong" });
    expect(res.status()).toBe(400);
  });

  test("存在しないユーザーで 400", async ({ request }) => {
    const api = new ApiClient(request);
    const res = await api.signin({ username: "nonexistent_12345", password: "test" });
    expect(res.status()).toBe(400);
  });
});

test.describe("POST /signout", () => {
  test("セッション無効化 → /me が 401", async ({ request }) => {
    const api = new ApiClient(request);
    await api.signin({ username: "o6yq16leo", password: "wsh-2026" });

    // Verify signed in
    const meRes1 = await api.me();
    expect(meRes1.status()).toBe(200);

    await api.signout();

    const meRes2 = await api.me();
    expect(meRes2.status()).toBe(401);
  });
});
