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
      const res = await fetch("/api/v1/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          sourceLanguage: params.sourceLanguage,
          targetLanguage: params.targetLanguage,
        }),
        credentials: "same-origin",
      });

      if (!res.ok) {
        throw new Error(`Translation failed: ${res.status}`);
      }

      const data = (await res.json()) as { result: string };
      return data.result;
    },
    [Symbol.dispose]: () => {},
  };
}
