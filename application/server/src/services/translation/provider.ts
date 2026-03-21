export interface TranslateParams {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  requesterIp?: string;
}

export interface TranslationProvider {
  translate(params: TranslateParams): Promise<string>;
}

export class TranslationProviderUpstreamError extends Error {
  status: number | undefined;
  responseText: string | null;

  constructor(message: string, options?: { status?: number; responseText?: string | null }) {
    super(message);
    this.name = "TranslationProviderUpstreamError";
    this.status = options?.status;
    this.responseText = options?.responseText ?? null;
  }
}

export class TranslationServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranslationServiceUnavailableError";
  }
}
