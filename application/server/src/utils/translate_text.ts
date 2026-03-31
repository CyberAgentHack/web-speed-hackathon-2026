import httpErrors from "http-errors";

interface Params {
  sourceLanguage: string;
  targetLanguage: string;
  text: string;
}

const TRANSLATION_CACHE_MAX_ENTRIES = 500;
const translationCache = new Map<string, string>();

function buildCacheKey(sourceLanguage: string, targetLanguage: string, text: string): string {
  return JSON.stringify({
    sourceLanguage,
    targetLanguage,
    text,
  });
}

function getCachedTranslation(cacheKey: string): string | undefined {
  const cached = translationCache.get(cacheKey);
  if (cached === undefined) {
    return undefined;
  }

  // Refresh insertion order to approximate LRU behavior.
  translationCache.delete(cacheKey);
  translationCache.set(cacheKey, cached);
  return cached;
}

function setCachedTranslation(cacheKey: string, translatedText: string): void {
  translationCache.set(cacheKey, translatedText);

  if (translationCache.size <= TRANSLATION_CACHE_MAX_ENTRIES) {
    return;
  }

  const oldestKey = translationCache.keys().next().value;
  if (typeof oldestKey === "string") {
    translationCache.delete(oldestKey);
  }
}

function toGoogleTranslateLanguageCode(language: string): string {
  const normalized = language.trim().toLowerCase();

  if (normalized === "japanese" || normalized === "ja-jp") {
    return "ja";
  }
  if (normalized === "english" || normalized === "en-us" || normalized === "en-gb") {
    return "en";
  }

  return normalized;
}

function parseGoogleTranslateResponse(payload: unknown): string {
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
    throw new httpErrors.BadGateway("Unexpected response from Google Translate API.");
  }

  const segments = payload[0]
    .map((entry) => (Array.isArray(entry) && typeof entry[0] === "string" ? entry[0] : ""))
    .join("")
    .trim();

  if (segments.length === 0) {
    throw new httpErrors.BadGateway("No translated text returned from Google Translate API.");
  }

  return segments;
}

export async function translateText(params: Params): Promise<string> {
  const source = toGoogleTranslateLanguageCode(params.sourceLanguage);
  const target = toGoogleTranslateLanguageCode(params.targetLanguage);
  const cacheKey = buildCacheKey(source, target, params.text);

  const cached = getCachedTranslation(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", source);
  url.searchParams.set("tl", target);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", params.text);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
      },
    });
  } catch {
    throw new httpErrors.BadGateway("Failed to reach Google Translate API.");
  }

  if (!response.ok) {
    throw new httpErrors.BadGateway(`Google Translate API returned ${response.status}.`);
  }

  let payload: unknown;
  try {
    payload = (await response.json()) as unknown;
  } catch {
    throw new httpErrors.BadGateway("Failed to parse Google Translate API response.");
  }

  const translatedText = parseGoogleTranslateResponse(payload);
  setCachedTranslation(cacheKey, translatedText);
  return translatedText;
}

// Legacy implementation intentionally preserved as comments by request.
// import { CreateMLCEngine } from "@mlc-ai/web-llm";
//
// interface TranslateResponse {
//   result: unknown;
// }
//
// const MODEL_ID = "gemma-2-2b-jpn-it-q4f16_1-MLC";
//
// let enginePromise: Promise<Awaited<ReturnType<typeof CreateMLCEngine>>> | undefined;
//
// async function getEngine(): Promise<Awaited<ReturnType<typeof CreateMLCEngine>>> {
//   if (enginePromise === undefined) {
//     enginePromise = CreateMLCEngine(MODEL_ID);
//   }
//   return enginePromise;
// }
//
// function parseResult(content: string): string {
//   try {
//     const parsed = JSON.parse(content) as TranslateResponse;
//     if (typeof parsed.result !== "string") {
//       throw new Error("The translation result is missing in the reply.");
//     }
//     return parsed.result;
//   } catch {
//     throw new httpErrors.BadGateway("Failed to parse translation response.");
//   }
// }
//
// export async function translateText(params: Params): Promise<string> {
//   const engine = await getEngine();
//   const reply = await engine.chat.completions.create({
//     messages: [
//       {
//         role: "system",
//         content:
//           `You are a professional translator. Translate the following text from ${params.sourceLanguage} to ${params.targetLanguage}. ` +
//           'Provide as JSON only in the format: { "result": "{{translated text}}" } without any additional explanations.',
//       },
//       {
//         role: "user",
//         content: params.text,
//       },
//     ],
//     response_format: { type: "json_object" },
//     temperature: 0,
//   });
//
//   const content = reply.choices[0]?.message.content;
//   if (typeof content !== "string") {
//     throw new httpErrors.BadGateway("No content in the reply from the translation engine.");
//   }
//
//   return parseResult(content);
// }
