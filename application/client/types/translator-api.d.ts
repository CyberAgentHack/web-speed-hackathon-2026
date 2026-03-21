interface Translator {
  translate(input: string): Promise<string>;
  destroy?(): void;
}

interface TranslatorFactory {
  availability(options: {
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<
    "unavailable" | "downloadable" | "downloading" | "available" | string
  >;
  create(options: {
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<Translator>;
}

declare var Translator: TranslatorFactory | undefined;
