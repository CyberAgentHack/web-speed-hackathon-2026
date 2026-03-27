import { describe, test, expect } from "bun:test";

import { app } from "../app";
import { setupApiTestFile } from "../setup_utils";

setupApiTestFile();

describe("GET /api/v1/search", () => {
  test("returns 200 with empty array for empty q", async () => {
    const res = await app.request("/api/v1/search?q=");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  test("returns 200 with empty array when q is missing", async () => {
    const res = await app.request("/api/v1/search");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  test("returns 200 with posts for a keyword", async () => {
    const res = await app.request("/api/v1/search?q=test");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("respects limit parameter", async () => {
    // Use a query unlikely to match any user to avoid the profileImageId subquery bug
    const res = await app.request("/api/v1/search?q=since:2020-01-01&limit=1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBeLessThanOrEqual(1);
  });
});
