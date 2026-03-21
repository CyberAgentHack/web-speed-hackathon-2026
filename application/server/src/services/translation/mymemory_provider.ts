import {
  TranslateParams,
  TranslationProvider,
  TranslationProviderUpstreamError,
} from "@web-speed-hackathon-2026/server/src/services/translation/provider";

const DEFAULT_MYMEMORY_API_BASE_URL = "https://api.mymemory.translated.net";

interface Params {
  apiBaseUrl?: string;
  contactEmail?: string;
}

interface MyMemoryTranslationResponse {
  responseData?: {
    translatedText?: unknown;
  };
  responseDetails?: unknown;
  responseStatus?: unknown;
}

export class MyMemoryTranslationProvider implements TranslationProvider {
  #apiBaseUrl: string;
  #contactEmail: string | undefined;

  constructor(params: Params) {
    this.#apiBaseUrl = params.apiBaseUrl ?? DEFAULT_MYMEMORY_API_BASE_URL;
    this.#contactEmail = params.contactEmail;
  }

  async translate(params: TranslateParams): Promise<string> {
    const url = new URL("/get", this.#apiBaseUrl);
    url.searchParams.set("langpair", `${params.sourceLanguage}|${params.targetLanguage}`);
    url.searchParams.set("mt", "1");
    url.searchParams.set("q", params.text);

    if (this.#contactEmail != null && this.#contactEmail.trim() !== "") {
      url.searchParams.set("de", this.#contactEmail);
    }
    if (params.requesterIp != null && params.requesterIp !== "") {
      url.searchParams.set("ip", params.requesterIp);
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new TranslationProviderUpstreamError("MyMemory translation request failed.", {
        responseText: await response.text(),
        status: response.status,
      });
    }

    const data = (await response.json()) as MyMemoryTranslationResponse;
    if (data.responseStatus !== undefined && data.responseStatus !== 200) {
      throw new TranslationProviderUpstreamError("MyMemory returned a non-success response.", {
        responseText:
          typeof data.responseDetails === "string" ? data.responseDetails : JSON.stringify(data),
        status: typeof data.responseStatus === "number" ? data.responseStatus : undefined,
      });
    }

    const result = data.responseData?.translatedText;
    if (typeof result !== "string" || result.trim() === "") {
      throw new TranslationProviderUpstreamError("MyMemory response did not include a translation.");
    }

    return result;
  }
}
