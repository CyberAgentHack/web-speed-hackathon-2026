import { describe, test, expect } from "bun:test";

import { app } from "../app";
import { setupApiTestFile } from "../setup_utils";
import { signupAndGetCookie } from "../helpers";

setupApiTestFile();

describe("POST /api/v1/initialize", () => {
  test("returns 200 and invalidates authenticated HTTP session", async () => {
    const { cookie } = await signupAndGetCookie(app, "initialize_reset_user", "pass123");

    const beforeReset = await app.request("/api/v1/me", {
      headers: { Cookie: cookie },
    });
    expect(beforeReset.status).toBe(200);

    const res = await app.request("/api/v1/initialize", {
      method: "POST",
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    const body = await res.json();
    expect(body).toEqual({});

    const afterReset = await app.request("/api/v1/me", {
      headers: { Cookie: cookie },
    });
    expect(afterReset.status).toBe(401);
  });
});
