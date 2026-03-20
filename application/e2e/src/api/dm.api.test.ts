import { expect, test } from "@playwright/test";
import * as v from "valibot";

import { ApiClient } from "./api-helpers";
import { ConversationSchema, DirectMessageSchema } from "./schemas";

const USER_A = { username: "o6yq16leo", password: "wsh-2026" };
const PEER_USERNAME = "p72k8qi1c3";

async function signinAndGetConvId(request: ConstructorParameters<typeof ApiClient>[0]): Promise<{
  api: ApiClient;
  convId: string;
}> {
  const api = new ApiClient(request);
  await api.signin(USER_A);
  const conversations = await (await api.getDmList()).json();
  expect(conversations.length).toBeGreaterThan(0);
  return { api, convId: conversations[0].id };
}

test.describe("GET /dm", () => {
  test("未認証で 401", async ({ request }) => {
    const api = new ApiClient(request);
    const res = await api.getDmList();
    expect(res.status()).toBe(401);
  });

  test("ConversationSchema[] に一致する", async ({ request }) => {
    const api = new ApiClient(request);
    await api.signin(USER_A);

    const res = await api.getDmList();
    expect(res.status()).toBe(200);

    const conversations = await res.json();
    expect(conversations.length).toBeGreaterThan(0);
    for (const conv of conversations) {
      expect(() => v.parse(ConversationSchema, conv)).not.toThrow();
    }
  });

  test("messages が空の会話は含まれない", async ({ request }) => {
    const api = new ApiClient(request);
    await api.signin(USER_A);

    const conversations = await (await api.getDmList()).json();
    for (const conv of conversations) {
      expect(conv.messages.length).toBeGreaterThan(0);
    }
  });

  test("messages が createdAt ASC でソート", async ({ request }) => {
    const api = new ApiClient(request);
    await api.signin(USER_A);

    const conversations = await (await api.getDmList()).json();
    for (const conv of conversations) {
      for (let i = 1; i < conv.messages.length; i++) {
        expect(conv.messages[i - 1].createdAt <= conv.messages[i].createdAt).toBe(true);
      }
    }
  });

  test("会話が最終メッセージの createdAt DESC でソート", async ({ request }) => {
    const api = new ApiClient(request);
    await api.signin(USER_A);

    const conversations = await (await api.getDmList()).json();
    for (let i = 1; i < conversations.length; i++) {
      const prevLast = conversations[i - 1].messages.at(-1)!.createdAt;
      const currLast = conversations[i].messages.at(-1)!.createdAt;
      expect(prevLast >= currLast).toBe(true);
    }
  });
});

test.describe("GET /dm/:id", () => {
  test("ConversationSchema に一致する", async ({ request }) => {
    const { api, convId } = await signinAndGetConvId(request);

    const res = await api.getDm(convId);
    expect(res.status()).toBe(200);

    const conv = await res.json();
    expect(() => v.parse(ConversationSchema, conv)).not.toThrow();
  });

  test("他ユーザーの会話にアクセスで 404", async ({ request }) => {
    // gg3i6j6 でログインし、o6yq16leo の会話 ID を使ってアクセス
    const apiA = new ApiClient(request);
    await apiA.signin(USER_A);
    const conversations = await (await apiA.getDmList()).json();
    const convIdOfA = conversations[0].id;

    // 別ユーザーでログイン（セッション上書き）
    await apiA.signin({ username: "gg3i6j6", password: "wsh-2026" });
    const res = await apiA.getDm(convIdOfA);
    expect(res.status()).toBe(404);
  });
});

test.describe("POST /dm", () => {
  test("既存会話は findOrCreate で同じ ID が返る", async ({ request }) => {
    const api = new ApiClient(request);
    await api.signin(USER_A);

    const peer = await (await api.getUser(PEER_USERNAME)).json();

    const res1 = await api.createDm(peer.id);
    const conv1 = await res1.json();

    const res2 = await api.createDm(peer.id);
    const conv2 = await res2.json();

    expect(conv1.id).toBe(conv2.id);
  });

  test("存在しない peerId で 404", async ({ request }) => {
    const api = new ApiClient(request);
    await api.signin(USER_A);

    const res = await api.createDm("00000000-0000-0000-0000-000000000000");
    expect(res.status()).toBe(404);
  });
});

test.describe("POST /dm/:id/messages", () => {
  test("DirectMessageSchema に一致する", async ({ request }) => {
    const { api, convId } = await signinAndGetConvId(request);

    const res = await api.sendDmMessage(convId, `test-${Date.now()}`);
    expect(res.status()).toBe(201);

    const msg = await res.json();
    expect(() => v.parse(DirectMessageSchema, msg)).not.toThrow();
  });

  test("空文字で 400", async ({ request }) => {
    const { api, convId } = await signinAndGetConvId(request);

    const res = await api.sendDmMessage(convId, "");
    expect(res.status()).toBe(400);
  });
});

test.describe("POST /dm/:id/read", () => {
  test("200 + {} を返す", async ({ request }) => {
    const { api, convId } = await signinAndGetConvId(request);

    const res = await api.markDmRead(convId);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toEqual({});
  });
});

test.describe("POST /dm/:id/typing", () => {
  test("200 + {} を返す", async ({ request }) => {
    const { api, convId } = await signinAndGetConvId(request);

    const res = await api.typeDm(convId);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toEqual({});
  });
});
