interface Translator {
  translate(text: string): Promise<string>;
  [Symbol.dispose](): void;
}

interface Params {
  sourceLanguage: string;
  targetLanguage: string;
}

export async function createTranslator(params: Params): Promise<Translator> {
  return {
    async translate(text: string): Promise<string> {
      const url = `/api/v1/translate?text=${encodeURIComponent(text)}&from=${encodeURIComponent(params.sourceLanguage)}&to=${encodeURIComponent(params.targetLanguage)}`;
      const res = await fetch(url);
      const json = await res.json();
      return String(json.result);
    },
    [Symbol.dispose]: () => {},
  };
}
