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
      const res = await fetch("/api/translate", {
        body: JSON.stringify({ text, sourceLang: params.sourceLanguage, targetLang: params.targetLanguage }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as { result: string };
      return data.result;
    },
    [Symbol.dispose]() {},
  };
}
