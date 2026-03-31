import { sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

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
      const response = await sendJSON<{ result: string }>("/api/v1/translate", {
        sourceLanguage: params.sourceLanguage,
        targetLanguage: params.targetLanguage,
        text,
      });

      return response.result;
    },
    [Symbol.dispose]: () => {},
  };
}
