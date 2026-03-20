import { FakeTranslationProvider } from "@web-speed-hackathon-2026/server/src/services/translation/fake_provider";
import {
  TranslateParams,
  TranslationProvider,
  TranslationServiceUnavailableError,
} from "@web-speed-hackathon-2026/server/src/services/translation/provider";

interface CacheEntry {
  result: string;
  expiresAt: number;
}

interface Params {
  cacheMaxEntries?: number;
  cacheTtlMs?: number;
  provider: TranslationProvider;
}

type TranslationProviderName = "fake";

export class TranslationService {
  #cache = new Map<string, CacheEntry>();
  #cacheMaxEntries: number;
  #cacheTtlMs: number;
  #provider: TranslationProvider;

  constructor(params: Params) {
    this.#cacheMaxEntries = params.cacheMaxEntries ?? 500;
    this.#cacheTtlMs = params.cacheTtlMs ?? 24 * 60 * 60 * 1000;
    this.#provider = params.provider;
  }

  async translate(params: TranslateParams): Promise<string> {
    const key = `${params.sourceLanguage}:${params.targetLanguage}:${params.text}`;
    const now = Date.now();
    const cached = this.#cache.get(key);

    if (cached != null) {
      if (cached.expiresAt > now) {
        this.#cache.delete(key);
        this.#cache.set(key, cached);
        return cached.result;
      }

      this.#cache.delete(key);
    }

    const result = await this.#provider.translate(params);

    this.#cache.set(key, {
      expiresAt: now + this.#cacheTtlMs,
      result,
    });
    this.#evictOverflow();

    return result;
  }

  #evictOverflow(): void {
    while (this.#cache.size > this.#cacheMaxEntries) {
      const oldestKey = this.#cache.keys().next().value;
      if (oldestKey == null) {
        break;
      }
      this.#cache.delete(oldestKey);
    }
  }
}

function parsePositiveInteger(value: string | undefined, defaultValue: number): number {
  if (value == null || value.trim() === "") {
    return defaultValue;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
}

export function createTranslationServiceFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): TranslationService {
  const providerName = env["TRANSLATION_PROVIDER"] as TranslationProviderName | undefined;

  if (providerName == null) {
    throw new TranslationServiceUnavailableError("TRANSLATION_PROVIDER is not configured.");
  }

  const provider =
    providerName === "fake" ? new FakeTranslationProvider() : null;

  if (provider == null) {
    throw new TranslationServiceUnavailableError(
      `Unsupported translation provider: ${providerName}.`,
    );
  }

  return new TranslationService({
    cacheMaxEntries: parsePositiveInteger(env["TRANSLATION_CACHE_MAX_ENTRIES"], 500),
    cacheTtlMs: parsePositiveInteger(env["TRANSLATION_CACHE_TTL_MS"], 24 * 60 * 60 * 1000),
    provider,
  });
}
