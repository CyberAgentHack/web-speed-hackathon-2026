import invariant from "tiny-invariant";

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
        body: JSON.stringify({ text, from: params.sourceLanguage, to: params.targetLanguage }),
      });

      invariant(res.ok, "Translation request failed");

      const data = (await res.json()) as { result: string };
      invariant(data.result != null, "No result in translation response");

      return data.result;
    },
    [Symbol.dispose]: () => {},
  };
}
