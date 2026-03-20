import { expect, test } from "@playwright/test";
import * as v from "valibot";

import { ApiClient } from "./api-helpers";
import { CommentSchema, PostDetailSchema } from "./schemas";

// Known seed data IDs
const POST_WITH_IMAGES = "d1bd6ba1-b5ba-4129-a16d-e1f898c3de1a";
const POST_WITH_MOVIE = "126968c6-890f-494d-922f-208c160d06a4";
const POST_WITH_SOUND = "d0d4a8a6-20ed-4a6a-a2d4-3e8bcc7ffc43";

test.describe("GET /posts", () => {
  test("レスポンス構造が PostDetailSchema に一致する", async ({ request }) => {
    const api = new ApiClient(request);
    const res = await api.getPosts({ limit: 3 });
    expect(res.status()).toBe(200);

    const posts = await res.json();
    expect(posts).toHaveLength(3);
    for (const post of posts) {
      expect(() => v.parse(PostDetailSchema, post)).not.toThrow();
    }
  });

  test("ソート順が決定的で、initialize 直後のスナップショットと一致する", async ({ request }) => {
    const api = new ApiClient(request);
    const posts = await (await api.getPosts({ limit: 5 })).json();

    // Sequelize detail scope + eager loading + subQuery による実際の順序をスナップショット固定
    // id DESC でも createdAt DESC でもない（eager loading の JOIN が ORDER BY を壊す既知の挙動）
    // Drizzle 移行後もこの順序を維持するか、正しい createdAt DESC に修正する
    const expectedIds = [
      "126968c6-890f-494d-922f-208c160d06a4",
      "5f38db05-a0f3-4712-b513-79d4cfe26a16",
      "d1bd6ba1-b5ba-4129-a16d-e1f898c3de1a",
      "cfa17c11-e119-45f5-8389-f00036b77afb",
      "64d8f48f-28f3-46a5-8e58-6b6543dcad25",
    ];
    const actualIds = posts.map((p: { id: string }) => p.id);
    expect(actualIds).toEqual(expectedIds);
  });

  test("limit=3&offset=3 でページ2が返り、ページ1と重複しない", async ({ request }) => {
    const api = new ApiClient(request);
    const page1 = await (await api.getPosts({ limit: 3 })).json();
    const page2 = await (await api.getPosts({ limit: 3, offset: 3 })).json();

    const page1Ids = new Set(page1.map((p: { id: string }) => p.id));
    for (const post of page2) {
      expect(page1Ids.has(post.id)).toBe(false);
    }
  });
});

test.describe("GET /posts/:postId", () => {
  test("単一投稿が PostDetailSchema に一致する", async ({ request }) => {
    const api = new ApiClient(request);
    const res = await api.getPost(POST_WITH_IMAGES);
    expect(res.status()).toBe(200);

    const post = await res.json();
    expect(() => v.parse(PostDetailSchema, post)).not.toThrow();
    expect(post.id).toBe(POST_WITH_IMAGES);
  });

  test("存在しない ID で 404", async ({ request }) => {
    const api = new ApiClient(request);
    const res = await api.getPost("00000000-0000-0000-0000-000000000000");
    expect(res.status()).toBe(404);
  });

  test("画像付き投稿の images が createdAt ASC でソート", async ({ request }) => {
    const api = new ApiClient(request);
    const post = await (await api.getPost(POST_WITH_IMAGES)).json();

    expect(post.images.length).toBeGreaterThan(0);
    for (let i = 1; i < post.images.length; i++) {
      expect(post.images[i - 1].createdAt <= post.images[i].createdAt).toBe(true);
    }
  });

  test("動画付き投稿の movie が非 null", async ({ request }) => {
    const api = new ApiClient(request);
    const post = await (await api.getPost(POST_WITH_MOVIE)).json();
    expect(post.movie).not.toBeNull();
    expect(post.movieId).not.toBeNull();
  });

  test("音声付き投稿の sound が非 null", async ({ request }) => {
    const api = new ApiClient(request);
    const post = await (await api.getPost(POST_WITH_SOUND)).json();
    expect(post.sound).not.toBeNull();
    expect(post.sound.title).toBeTruthy();
    expect(post.sound.artist).toBeTruthy();
  });
});

test.describe("GET /posts/:postId/comments", () => {
  test("CommentSchema に一致する", async ({ request }) => {
    const api = new ApiClient(request);
    const res = await api.getComments(POST_WITH_IMAGES, { limit: 3 });
    expect(res.status()).toBe(200);

    const comments = await res.json();
    expect(comments.length).toBeGreaterThan(0);
    for (const comment of comments) {
      expect(() => v.parse(CommentSchema, comment)).not.toThrow();
    }
  });

  test("createdAt ASC でソートされている", async ({ request }) => {
    const api = new ApiClient(request);
    const comments = await (await api.getComments(POST_WITH_IMAGES, { limit: 10 })).json();

    for (let i = 1; i < comments.length; i++) {
      expect(comments[i - 1].createdAt <= comments[i].createdAt).toBe(true);
    }
  });

  test("userId, postId が除外されている", async ({ request }) => {
    const api = new ApiClient(request);
    const comments = await (await api.getComments(POST_WITH_IMAGES, { limit: 1 })).json();

    expect(comments[0]).not.toHaveProperty("userId");
    expect(comments[0]).not.toHaveProperty("postId");
  });
});
