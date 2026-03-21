import { sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Params {
  sourceLanguage: string;
  targetLanguage: string;
  text: string;
}

interface ResponseBody {
  result: string;
}

const STORAGE_KEY_PREFIX = "translation-cache:";
const translationCache = new Map<string, string>();
const pendingTranslations = new Map<string, Promise<string>>();

function getCacheKey(params: Params): string {
  return `${params.sourceLanguage}:${params.targetLanguage}:${params.text}`;
}

function readFromSessionStorage(key: string): string | null {
  try {
    return window.sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
  } catch {
    return null;
  }
}

function writeToSessionStorage(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, value);
  } catch {
    // Ignore storage quota and privacy-mode failures.
  }
}

export async function translateText(params: Params): Promise<string> {
  const key = getCacheKey(params);

  const cached = translationCache.get(key);
  if (cached != null) {
    return cached;
  }

  const stored = readFromSessionStorage(key);
  if (stored != null) {
    translationCache.set(key, stored);
    return stored;
  }

  const pending = pendingTranslations.get(key);
  if (pending != null) {
    return pending;
  }

  const request = sendJSON<ResponseBody>("/api/v1/translations", params)
    .then((response) => {
      translationCache.set(key, response.result);
      writeToSessionStorage(key, response.result);
      pendingTranslations.delete(key);
      return response.result;
    })
    .catch((error: unknown) => {
      pendingTranslations.delete(key);
      throw error;
    });

  pendingTranslations.set(key, request);
  return request;
}
