interface TranslatorCreateOptions {
  sourceLanguage: string;
  targetLanguage: string;
}

type TranslatorAvailability = "available" | "downloadable" | "downloading" | "unavailable";

interface Translator {
  readonly inputQuota: number;
  readonly sourceLanguage: string;
  readonly targetLanguage: string;
  translate(text: string): Promise<string>;
  destroy(): void;
}

interface TranslatorStatic {
  availability(options: TranslatorCreateOptions): Promise<TranslatorAvailability>;
  create(options: TranslatorCreateOptions): Promise<Translator>;
}

declare global {
  var Translator: TranslatorStatic | undefined;
}

export {};
