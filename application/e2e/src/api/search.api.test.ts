import { expect, test } from "@playwright/test";
import * as v from "valibot";

import { ApiClient } from "./api-helpers";
import { PostDetailSchema } from "./schemas";

test.describe("GET /search", () => {
  test("テキスト検索で PostDetailSchema[] に一致する", async ({ request }) => {
    const api = new ApiClient(request);
    const res = await api.search("写真", { limit: 3 });
    expect(res.status()).toBe(200);

    const posts = await res.json();
    expect(posts.length).toBeGreaterThan(0);
    for (const post of posts) {
      expect(() => v.parse(PostDetailSchema, post)).not.toThrow();
    }
  });

  test("空クエリで []", async ({ request }) => {
    const api = new ApiClient(request);
    const res = await api.search("");
    expect(res.status()).toBe(200);

    const posts = await res.json();
    expect(posts).toEqual([]);
  });

  test("limit=3 で 3 件以下", async ({ request }) => {
    const api = new ApiClient(request);
    const res = await api.search("写真", { limit: 3 });
    expect(res.status()).toBe(200);

    const posts = await res.json();
    expect(posts.length).toBeGreaterThan(0);
    expect(posts.length).toBeLessThanOrEqual(3);
  });

  test("since + until 範囲フィルタが適用される", async ({ request }) => {
    const api = new ApiClient(request);
    const since = "2026-01-31";
    const until = "2026-01-31";
    const res = await api.search(`since:${since} until:${until}`);
    expect(res.status()).toBe(200);

    const posts = await res.json();
    expect(posts.length).toBeGreaterThan(0);
    for (const post of posts) {
      expect(() => v.parse(PostDetailSchema, post)).not.toThrow();
    }
  });

  test("ユーザー名でもヒットする", async ({ request }) => {
    const api = new ApiClient(request);
    const posts = await (await api.search("o6yq16leo")).json();
    expect(posts.length).toBeGreaterThan(0);
    for (const post of posts) {
      expect(() => v.parse(PostDetailSchema, post)).not.toThrow();
    }
  });
});
