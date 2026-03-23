interface Translator {
  translate(text: string): Promise<string>;
  [Symbol.dispose](): void;
}

interface Params {
  sourceLanguage: string;
  targetLanguage: string;
}

export async function createTranslator(params: Params): Promise<Translator> {
  if (params.sourceLanguage.trim() === "") {
    throw new Error("sourceLanguage must not be empty.");
  }
  if (params.targetLanguage.trim() === "") {
    throw new Error("targetLanguage must not be empty.");
  }

  if (globalThis.Translator == null) {
    throw new Error("Translator API is not available in this browser.");
  }

  const availability = await globalThis.Translator.availability({
    sourceLanguage: params.sourceLanguage,
    targetLanguage: params.targetLanguage,
  });
  if (availability === "unavailable") {
    throw new Error("Translator model is unavailable.");
  }

  const translator = await globalThis.Translator.create({
    sourceLanguage: params.sourceLanguage,
    targetLanguage: params.targetLanguage,
  });

  return {
    async translate(text: string): Promise<string> {
      return await translator.translate(text);
    },
    [Symbol.dispose]: () => {
      translator.destroy();
    },
  };
}
