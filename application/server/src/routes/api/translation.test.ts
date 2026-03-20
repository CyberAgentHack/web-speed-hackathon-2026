import assert from "node:assert/strict";
import test from "node:test";

import { Request, Response } from "express";
import httpErrors from "http-errors";

import {
  handleTranslationRequest,
  resetTranslationRouteStateForTests,
} from "@web-speed-hackathon-2026/server/src/routes/api/translation";

const originalEnv = {
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
}): Request {
  return {
    body,
    ip: "127.0.0.1",
  } as Request;
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
    response as Response,
  );

  assert.equal(state.statusCode, 200);
  assert.equal(state.contentType, "application/json");
  assert.deepEqual(state.body, { result: "[en] こんにちは" });
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
      response as Response,
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
      response as Response,
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
    firstResponse.response as Response,
  );

  assert.equal(firstResponse.state.statusCode, 200);

  await assertHttpError(
    handleTranslationRequest(
      createRequest({
        sourceLanguage: "ja",
        targetLanguage: "en",
        text: "こんばんは",
      }),
      secondResponse.response as Response,
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
      response as Response,
    ),
    503,
  );
});
