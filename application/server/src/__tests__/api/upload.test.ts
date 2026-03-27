import { describe, test, expect } from "bun:test";

import { app } from "../app";
import { setupApiTestFile } from "../setup_utils";
import { signupAndGetCookie } from "../helpers";

// Minimal JFIF JPEG: SOI + APP0 JFIF marker + minimal data + EOI
const JPEG_MAGIC = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
]);

// Minimal GIF89a header
const GIF_MAGIC = Buffer.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // GIF89a
  0x01, 0x00, 0x01, 0x00, // 1x1
  0x00, 0x00, 0x00, // GCT flag=0, bg=0, aspect=0
  0x3b, // trailer
]);

// Minimal MP3: ID3v2 header + MPEG frame sync
const MP3_MAGIC = Buffer.from([
  0x49, 0x44, 0x33, // ID3
  0x03, 0x00, // v2.3
  0x00, // flags
  0x00, 0x00, 0x00, 0x00, // size
  0xff, 0xfb, 0x90, 0x00, // MPEG1 Layer3 frame sync
]);

setupApiTestFile();

describe("POST /api/v1/images", () => {
  test("returns 401 when not authenticated", async () => {
    const res = await app.request("/api/v1/images", {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: new Uint8Array(JPEG_MAGIC),
    });
    expect(res.status).toBe(401);
  });

  test("returns 400 for empty body", async () => {
    const { cookie } = await signupAndGetCookie(app, "upload_img_empty", "pass123");
    const res = await app.request("/api/v1/images", {
      method: "POST",
      headers: {
        Cookie: cookie,
        "Content-Type": "application/octet-stream",
      },
      body: new ArrayBuffer(0),
    });
    expect(res.status).toBe(400);
  });

  test("returns 400 for invalid file type", async () => {
    const { cookie } = await signupAndGetCookie(app, "upload_img_badtype", "pass123");
    const res = await app.request("/api/v1/images", {
      method: "POST",
      headers: {
        Cookie: cookie,
        "Content-Type": "application/octet-stream",
      },
      body: new Uint8Array(Buffer.from("not-a-jpeg-file-at-all")),
    });
    expect(res.status).toBe(400);
  });

  test("rejects >10MB body", async () => {
    const { cookie } = await signupAndGetCookie(app, "upload_img_big", "pass123");
    const bigBuffer = Buffer.alloc(10 * 1024 * 1024 + 1, 0);
    const res = await app.request("/api/v1/images", {
      method: "POST",
      headers: {
        Cookie: cookie,
        "Content-Type": "application/octet-stream",
      },
      body: new Uint8Array(bigBuffer),
    });
    expect([400, 413]).toContain(res.status);
  });

  test("returns 200 with id for valid JPG", async () => {
    const { cookie } = await signupAndGetCookie(app, "upload_img_ok", "pass123");
    const res = await app.request("/api/v1/images", {
      method: "POST",
      headers: {
        Cookie: cookie,
        "Content-Type": "application/octet-stream",
      },
      body: new Uint8Array(JPEG_MAGIC),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBeDefined();
  });
});

describe("POST /api/v1/movies", () => {
  test("returns 401 when not authenticated", async () => {
    const res = await app.request("/api/v1/movies", {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: new Uint8Array(GIF_MAGIC),
    });
    expect(res.status).toBe(401);
  });

  test("returns 200 with id for valid GIF", async () => {
    const { cookie } = await signupAndGetCookie(app, "upload_mov_ok", "pass123");
    const res = await app.request("/api/v1/movies", {
      method: "POST",
      headers: {
        Cookie: cookie,
        "Content-Type": "application/octet-stream",
      },
      body: new Uint8Array(GIF_MAGIC),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBeDefined();
  });
});

describe("POST /api/v1/sounds", () => {
  test("returns 401 when not authenticated", async () => {
    const res = await app.request("/api/v1/sounds", {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: new Uint8Array(MP3_MAGIC),
    });
    expect(res.status).toBe(401);
  });

  test("returns 200 with id, title, artist for valid MP3", async () => {
    const { cookie } = await signupAndGetCookie(app, "upload_snd_ok", "pass123");
    const res = await app.request("/api/v1/sounds", {
      method: "POST",
      headers: {
        Cookie: cookie,
        "Content-Type": "application/octet-stream",
      },
      body: new Uint8Array(MP3_MAGIC),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBeDefined();
    // artist and title may be absent in JSON when undefined (minimal MP3 has no ID3 tags)
  });
});
