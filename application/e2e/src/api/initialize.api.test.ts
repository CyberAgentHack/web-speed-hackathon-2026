import { expect, test } from "@playwright/test";

import { ApiClient } from "./api-helpers";

// Run initialize tests serially — they reset the DB
test.describe.configure({ mode: "serial" });

test.describe("POST /initialize", () => {
  test("200 + {} を返す", async ({ request }) => {
    const api = new ApiClient(request);
    const res = await api.initialize();
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toEqual({});
  });

  test("シードデータが復元される", async ({ request }) => {
    const api = new ApiClient(request);

    // Reset
    await api.initialize();

    // Known seed post should be accessible
    const res = await api.getPost("d1bd6ba1-b5ba-4129-a16d-e1f898c3de1a");
    expect(res.status()).toBe(200);

    const post = await res.json();
    expect(post.id).toBe("d1bd6ba1-b5ba-4129-a16d-e1f898c3de1a");

    // Known seed user should be accessible
    const userRes = await api.signin({ username: "o6yq16leo", password: "wsh-2026" });
    expect(userRes.status()).toBe(200);
  });

  test("signup で作ったユーザーが initialize 後に消える", async ({ request }) => {
    const api = new ApiClient(request);

    // Create a temp user
    const username = `init_test_${Date.now().toString(36)}`;
    const signupRes = await api.signup({ username, name: "Init Test", password: "testpass123" });
    expect(signupRes.status()).toBe(200);

    // Verify user exists
    const signinBefore = await api.signin({ username, password: "testpass123" });
    expect(signinBefore.status()).toBe(200);

    // Reset DB
    const initRes = await api.initialize();
    expect(initRes.status()).toBe(200);

    // User should no longer exist
    const signinAfter = await api.signin({ username, password: "testpass123" });
    expect(signinAfter.status()).toBe(400);
  });
});
