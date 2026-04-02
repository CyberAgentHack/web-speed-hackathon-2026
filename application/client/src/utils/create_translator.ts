import langs from "langs";
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
  const sourceLang = langs.where("1", params.sourceLanguage);
  invariant(sourceLang, `Unsupported source language code: ${params.sourceLanguage}`);

  const targetLang = langs.where("1", params.targetLanguage);
  invariant(targetLang, `Unsupported target language code: ${params.targetLanguage}`);

  return {
    async translate(text: string): Promise<string> {
      const response = await fetch("/api/v1/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceLanguage: params.sourceLanguage,
          targetLanguage: params.targetLanguage,
          text,
        }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        console.error("translation endpoint error", response.status, response.statusText, body);
        throw new Error("translation server failed");
      }

      const data = (await response.json()) as { result?: string };
      if (!data || typeof data.result !== "string") {
        console.error("translation result is invalid", data);
        throw new Error("Invalid translation response");
      }

      return data.result;
    },
    [Symbol.dispose]: () => {
      // No local model to dispose now.
    },
  };
}
