import langs from "langs";
import invariant from "tiny-invariant";

interface AppTranslator {
  translate(text: string): Promise<string>;
  [Symbol.dispose](): void;
}

interface Params {
  sourceLanguage: string;
  targetLanguage: string;
}

interface TranslateResponse {
  result: string;
}

export async function createTranslator(params: Params): Promise<AppTranslator> {
  const sourceLang = langs.where("1", params.sourceLanguage);
  invariant(sourceLang, `Unsupported source language code: ${params.sourceLanguage}`);

  const targetLang = langs.where("1", params.targetLanguage);
  invariant(targetLang, `Unsupported target language code: ${params.targetLanguage}`);

  return {
    async translate(text: string): Promise<string> {
      const response = await fetch("/api/v1/translate", {
        body: JSON.stringify({
          sourceLanguage: sourceLang["1"],
          targetLanguage: targetLang["1"],
          text,
        }),
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Translation request failed with status ${response.status}`);
      }

      const data = (await response.json()) as TranslateResponse;
      return data.result;
    },
    [Symbol.dispose]: () => {},
  };
}
