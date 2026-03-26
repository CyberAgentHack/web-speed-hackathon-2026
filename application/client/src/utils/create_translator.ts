/// <reference types="@types/dom-chromium-ai" />

interface TranslatorWrapper {
  translate(text: string): Promise<string>;
  [Symbol.dispose](): void;
}

interface Params {
  sourceLanguage: string;
  targetLanguage: string;
}

export async function createTranslator(params: Params): Promise<TranslatorWrapper> {
  const t = await Translator.create({
    sourceLanguage: params.sourceLanguage,
    targetLanguage: params.targetLanguage,
  });

  return {
    async translate(text: string): Promise<string> {
      return await t.translate(text);
    },
    [Symbol.dispose]: () => {
      t.destroy();
    },
  };
}
