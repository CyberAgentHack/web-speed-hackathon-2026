import assert from "node:assert/strict";
import test from "node:test";

import type { Request as ExpressRequest, Response as ExpressResponse } from "express";
import httpErrors from "http-errors";

import {
  handleTranslationRequest,
  resetTranslationRouteStateForTests,
} from "@web-speed-hackathon-2026/server/src/routes/api/translation";

const originalEnv = {
  MYMEMORY_API_BASE_URL: process.env["MYMEMORY_API_BASE_URL"],
  TRANSLATION_CONTACT_EMAIL: process.env["TRANSLATION_CONTACT_EMAIL"],
  TRANSLATION_PROVIDER: process.env["TRANSLATION_PROVIDER"],
  TRANSLATION_RATE_LIMIT_PER_MINUTE: process.env["TRANSLATION_RATE_LIMIT_PER_MINUTE"],
};

function restoreEnv(): void {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value == null) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function createMockResponse() {
  const state: {
    body: unknown;
    contentType: string | null;
    statusCode: number;
  } = {
    body: null,
    contentType: null,
    statusCode: 200,
  };

  const response = {
    send(body: unknown) {
      state.body = body;
      return this;
    },
    status(code: number) {
      state.statusCode = code;
      return this;
    },
    type(value: string) {
      state.contentType = value;
      return this;
    },
  };

  return { response, state };
}

function createRequest(body: {
  sourceLanguage: string;
  targetLanguage: string;
  text: string;
}): ExpressRequest {
  return {
    body,
    ip: "127.0.0.1",
  } as ExpressRequest;
}

async function assertHttpError(
  promise: Promise<unknown>,
  expectedStatus: number,
): Promise<void> {
  await assert.rejects(promise, (error: unknown) => {
    return httpErrors.isHttpError(error) && error.statusCode === expectedStatus;
  });
}

test.afterEach(() => {
  restoreEnv();
  resetTranslationRouteStateForTests();
});

test("handleTranslationRequest returns a translated result", async () => {
  process.env["TRANSLATION_PROVIDER"] = "fake";
  resetTranslationRouteStateForTests();

  const { response, state } = createMockResponse();

  await handleTranslationRequest(
    createRequest({
      sourceLanguage: "ja",
      targetLanguage: "en",
      text: "こんにちは",
    }),
    response as unknown as ExpressResponse,
  );

  assert.equal(state.statusCode, 200);
  assert.equal(state.contentType, "application/json");
  assert.deepEqual(state.body, { result: "[en] こんにちは" });
});

test("handleTranslationRequest defaults to MyMemory when TRANSLATION_PROVIDER is unset", async () => {
  delete process.env["TRANSLATION_PROVIDER"];
  process.env["MYMEMORY_API_BASE_URL"] = "https://example.com";
  resetTranslationRouteStateForTests();

  const { response, state } = createMockResponse();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    assert.equal(String(input), "https://example.com/get?langpair=ja%7Cen&mt=1&q=%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF&ip=127.0.0.1");
    return new Response(
      JSON.stringify({
        responseData: {
          translatedText: "Hello",
        },
        responseStatus: 200,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
        status: 200,
      },
    );
  };

  try {
    await handleTranslationRequest(
      createRequest({
        sourceLanguage: "ja",
        targetLanguage: "en",
        text: "こんにちは",
      }),
      response as unknown as ExpressResponse,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(state.statusCode, 200);
  assert.deepEqual(state.body, { result: "Hello" });
});

test("handleTranslationRequest rejects empty text", async () => {
  process.env["TRANSLATION_PROVIDER"] = "fake";
  resetTranslationRouteStateForTests();

  const { response } = createMockResponse();

  await assertHttpError(
    handleTranslationRequest(
      createRequest({
        sourceLanguage: "ja",
        targetLanguage: "en",
        text: "   ",
      }),
      response as unknown as ExpressResponse,
    ),
    400,
  );
});

test("handleTranslationRequest rejects invalid language codes", async () => {
  process.env["TRANSLATION_PROVIDER"] = "fake";
  resetTranslationRouteStateForTests();

  const { response } = createMockResponse();

  await assertHttpError(
    handleTranslationRequest(
      createRequest({
        sourceLanguage: "jaa",
        targetLanguage: "en",
        text: "こんにちは",
      }),
      response as unknown as ExpressResponse,
    ),
    400,
  );
});

test("handleTranslationRequest enforces a per-IP rate limit", async () => {
  process.env["TRANSLATION_PROVIDER"] = "fake";
  process.env["TRANSLATION_RATE_LIMIT_PER_MINUTE"] = "1";
  resetTranslationRouteStateForTests();

  const firstResponse = createMockResponse();
  const secondResponse = createMockResponse();

  await handleTranslationRequest(
    createRequest({
      sourceLanguage: "ja",
      targetLanguage: "en",
      text: "こんにちは",
    }),
    firstResponse.response as unknown as ExpressResponse,
  );

  assert.equal(firstResponse.state.statusCode, 200);

  await assertHttpError(
    handleTranslationRequest(
      createRequest({
        sourceLanguage: "ja",
        targetLanguage: "en",
        text: "こんばんは",
      }),
      secondResponse.response as unknown as ExpressResponse,
    ),
    429,
  );
});

test("handleTranslationRequest returns 503 when the provider is misconfigured", async () => {
  process.env["TRANSLATION_PROVIDER"] = "unsupported";
  resetTranslationRouteStateForTests();

  const { response } = createMockResponse();

  await assertHttpError(
    handleTranslationRequest(
      createRequest({
        sourceLanguage: "ja",
        targetLanguage: "en",
        text: "こんにちは",
      }),
      response as unknown as ExpressResponse,
    ),
    503,
  );
});
