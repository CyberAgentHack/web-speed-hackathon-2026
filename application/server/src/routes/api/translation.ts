import { Request, Response, Router } from "express";
import httpErrors from "http-errors";

import {
  TranslationProviderUpstreamError,
  TranslationServiceUnavailableError,
} from "@web-speed-hackathon-2026/server/src/services/translation/provider";
import {
  TranslationService,
  createTranslationServiceFromEnv,
} from "@web-speed-hackathon-2026/server/src/services/translation/service";

export const translationRouter = Router();

const LANGUAGE_CODE_PATTERN = /^[a-z]{2}$/i;

interface RateLimitEntry {
  count: number;
  startedAt: number;
}

class FixedWindowRateLimiter {
  #entries = new Map<string, RateLimitEntry>();
  #limitPerMinute: number;

  constructor(limitPerMinute: number) {
    this.#limitPerMinute = limitPerMinute;
  }

  consume(key: string): boolean {
    const now = Date.now();
    const current = this.#entries.get(key);

    if (current == null || now - current.startedAt >= 60_000) {
      this.#entries.set(key, { count: 1, startedAt: now });
      return true;
    }

    if (current.count >= this.#limitPerMinute) {
      return false;
    }

    this.#entries.set(key, { ...current, count: current.count + 1 });
    return true;
  }

  reset(): void {
    this.#entries.clear();
  }
}

let translationService: TranslationService | undefined;
let rateLimiter = new FixedWindowRateLimiter(readRateLimitFromEnv());

function readRateLimitFromEnv(): number {
  const rawValue = process.env["TRANSLATION_RATE_LIMIT_PER_MINUTE"];

  if (rawValue == null || rawValue.trim() === "") {
    return 20;
  }

  const parsed = Number(rawValue);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 20;
}

function getTranslationService(): TranslationService {
  translationService ??= createTranslationServiceFromEnv();
  return translationService;
}

export function resetTranslationRouteStateForTests(): void {
  translationService = undefined;
  rateLimiter = new FixedWindowRateLimiter(readRateLimitFromEnv());
  rateLimiter.reset();
}

export async function handleTranslationRequest(req: Request, res: Response): Promise<Response> {
  const text = req.body?.text;
  const sourceLanguage = req.body?.sourceLanguage;
  const targetLanguage = req.body?.targetLanguage;

  if (typeof text !== "string" || text.trim() === "") {
    throw new httpErrors.BadRequest("Text must be a non-empty string.");
  }
  if (typeof sourceLanguage !== "string" || !LANGUAGE_CODE_PATTERN.test(sourceLanguage)) {
    throw new httpErrors.BadRequest("sourceLanguage must be a two-letter alphabetic code.");
  }
  if (typeof targetLanguage !== "string" || !LANGUAGE_CODE_PATTERN.test(targetLanguage)) {
    throw new httpErrors.BadRequest("targetLanguage must be a two-letter alphabetic code.");
  }

  if (!rateLimiter.consume(req.ip ?? "unknown")) {
    throw new httpErrors.TooManyRequests("Translation rate limit exceeded.");
  }

  try {
    const result = await getTranslationService().translate({
      sourceLanguage: sourceLanguage.toLowerCase(),
      targetLanguage: targetLanguage.toLowerCase(),
      text: text.trim(),
    });

    return res.status(200).type("application/json").send({ result });
  } catch (error) {
    if (error instanceof TranslationServiceUnavailableError) {
      throw new httpErrors.ServiceUnavailable(error.message);
    }
    if (error instanceof TranslationProviderUpstreamError) {
      throw new httpErrors.BadGateway(error.message);
    }
    throw error;
  }
}

translationRouter.post("/translations", handleTranslationRequest);
