import { describe, test, expect } from "bun:test";
import { gzipSync } from "node:zlib";

import { app } from "../app";
import { setupApiTestFile } from "../setup_utils";
import { signupAndGetCookie } from "../helpers";

setupApiTestFile();

describe("HTTP boundary behavior", () => {
  test("unknown API route returns 404", async () => {
    const res = await app.request("/api/v1/does-not-exist");
    expect(res.status).toBe(404);
  });

  test("tampered session cookie is rejected by authenticated route", async () => {
    const { cookie } = await signupAndGetCookie(app, "tampered_cookie_user", "pass123");
    const [firstCookie, ...rest] = cookie.split(";");
    expect(firstCookie).toBeTruthy();
    const [cookieName] = firstCookie!.split("=");
    const tamperedCookie = [`${cookieName}=tampered.invalid`, ...rest].join(";");

    const res = await app.request("/api/v1/me", {
      headers: { Cookie: tamperedCookie },
    });
    expect(res.status).toBe(401);
  });

  test("gzip-compressed JSON request is accepted by signin route", async () => {
    await app.request("/api/v1/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "gzip_signin_user",
        password: "pass123",
        name: "Gzip User",
      }),
    });

    const payload = gzipSync(
      Buffer.from(JSON.stringify({ username: "gzip_signin_user", password: "pass123" })),
    );
    const res = await app.request("/api/v1/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Encoding": "gzip",
      },
      body: new Uint8Array(payload),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.username).toBe("gzip_signin_user");
  });

  test("gzip-compressed malformed JSON returns 400", async () => {
    const payload = gzipSync(Buffer.from("{"));
    const res = await app.request("/api/v1/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Encoding": "gzip",
      },
      body: new Uint8Array(payload),
    });

    expect([400, 415]).toContain(res.status);
  });

  test("unknown content-encoding on binary upload is rejected", async () => {
    const { cookie } = await signupAndGetCookie(app, "upload_unknown_encoding", "pass123");
    const res = await app.request("/api/v1/images", {
      method: "POST",
      headers: {
        Cookie: cookie,
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "zstd",
      },
      body: new Uint8Array(Buffer.from("image-bytes")),
    });

    expect([400, 415]).toContain(res.status);
  });

  test("corrupted gzip binary upload returns 400", async () => {
    const { cookie } = await signupAndGetCookie(app, "upload_bad_gzip", "pass123");
    const res = await app.request("/api/v1/images", {
      method: "POST",
      headers: {
        Cookie: cookie,
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "gzip",
      },
      body: new Uint8Array(Buffer.from("not-valid-gzip")),
    });

    expect(res.status).toBe(400);
  });
});
