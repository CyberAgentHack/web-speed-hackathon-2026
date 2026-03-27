import { describe, test, expect } from "bun:test";

import { app } from "../app";
import { setupApiTestFile } from "../setup_utils";
import { signupAndGetCookie } from "../helpers";
import { clearSessions } from "../session_utils";

setupApiTestFile();

describe("POST /api/v1/signup", () => {
  test("returns 200 with user JSON and Set-Cookie on success", async () => {
    const res = await app.request("/api/v1/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "auth_signup_ok", password: "pass123", name: "Test User" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).not.toBeNull();
    const body = await res.json();
    expect(body.username).toBe("auth_signup_ok");
  });

  test("returns 400 with USERNAME_TAKEN for duplicate username", async () => {
    const username = "auth_dup_user";
    await app.request("/api/v1/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password: "pass123", name: "First" }),
    });

    const res = await app.request("/api/v1/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password: "pass456", name: "Second" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("USERNAME_TAKEN");
  });

  test("returns 400 with INVALID_USERNAME for invalid username", async () => {
    const res = await app.request("/api/v1/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "invalid user!@#", password: "pass123", name: "Bad" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("INVALID_USERNAME");
  });
});

describe("POST /api/v1/signin", () => {
  test("returns 200 with user JSON and Set-Cookie on success", async () => {
    // Create user first
    await app.request("/api/v1/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "auth_signin_ok", password: "mypass", name: "SignIn User" }),
    });

    const res = await app.request("/api/v1/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "auth_signin_ok", password: "mypass" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).not.toBeNull();
    const body = await res.json();
    expect(body.username).toBe("auth_signin_ok");
  });

  test("establishes a session that can access /api/v1/me", async () => {
    await app.request("/api/v1/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "auth_signin_me_ok",
        password: "mypass",
        name: "SignIn Me User",
      }),
    });

    const signinRes = await app.request("/api/v1/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "auth_signin_me_ok", password: "mypass" }),
    });
    expect(signinRes.status).toBe(200);
    const cookie = signinRes.headers.get("set-cookie")!;

    const meRes = await app.request("/api/v1/me", {
      headers: { Cookie: cookie },
    });
    expect(meRes.status).toBe(200);
    const meBody = await meRes.json();
    expect(meBody.username).toBe("auth_signin_me_ok");
  });

  test("returns 400 for non-existent username", async () => {
    const res = await app.request("/api/v1/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "noexist_user_xyz", password: "pass" }),
    });
    expect(res.status).toBe(400);
  });

  test("returns 400 for wrong password", async () => {
    await app.request("/api/v1/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "auth_wrongpw", password: "correct", name: "WrongPw" }),
    });

    const res = await app.request("/api/v1/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "auth_wrongpw", password: "incorrect" }),
    });
    expect(res.status).toBe(400);
  });

  test("returns 400 for malformed JSON", async () => {
    const res = await app.request("/api/v1/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-valid-json{{{",
    });
    expect(res.status).toBe(400);
  });

  test("returns 400 when username/password are not strings", async () => {
    const res = await app.request("/api/v1/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: 123, password: true }),
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/signout", () => {
  test("returns 200 with empty object", async () => {
    const { cookie } = await signupAndGetCookie(app, "auth_signout_user", "pass123");

    const res = await app.request("/api/v1/signout", {
      method: "POST",
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({});
  });

  test("invalidates session for subsequent /api/v1/me requests", async () => {
    const { cookie } = await signupAndGetCookie(app, "auth_signout_me_user", "pass123");

    const signoutRes = await app.request("/api/v1/signout", {
      method: "POST",
      headers: { Cookie: cookie },
    });
    expect(signoutRes.status).toBe(200);

    const meRes = await app.request("/api/v1/me", {
      headers: { Cookie: cookie },
    });
    expect(meRes.status).toBe(401);
    const meBody = await meRes.json();
    expect(meBody).toEqual({ message: "Unauthorized" });
  });

  test("returns 401 for /api/v1/me after clearing the session backend with old cookie", async () => {
    const { cookie } = await signupAndGetCookie(app, "auth_clear_user", "pass123");

    const beforeClear = await app.request("/api/v1/me", {
      headers: { Cookie: cookie },
    });
    expect(beforeClear.status).toBe(200);

    await clearSessions();

    const afterClear = await app.request("/api/v1/me", {
      headers: { Cookie: cookie },
    });
    expect(afterClear.status).toBe(401);
    const body = await afterClear.json();
    expect(body).toEqual({ message: "Unauthorized" });
  });
});
