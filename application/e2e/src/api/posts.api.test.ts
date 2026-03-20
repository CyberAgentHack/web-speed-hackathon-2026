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

    // id DESC でソートされる（defaultScope + detail scope の order 指定）
    const expectedIds = [
      "fff790f5-99ea-432f-8f79-21d3d49efd1a",
      "ffec432e-af82-44ec-9916-bdbd95492013",
      "ffe1378a-69b1-4397-bced-82c6a455a363",
      "ffc87987-0971-4d9d-80b2-6b8d19f8d7de",
      "ffb89956-8354-4599-9595-3d9fb04e4005",
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
