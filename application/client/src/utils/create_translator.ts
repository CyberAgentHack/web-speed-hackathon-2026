import invariant from "tiny-invariant";
import { fetchJSON } from "./fetchers";

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
      const reply = await fetchJSON<{ responseData?: { translatedText?: string } }>("https://api.mymemory.translated.net/get", {
        q: text,
        langpair: `${params.sourceLanguage}|${params.targetLanguage}`,
      });

      invariant(
        reply != null && reply.responseData?.translatedText !== undefined,
        "The translation result is missing in the reply.",
      );

      return String(reply.responseData.translatedText);
    },
    [Symbol.dispose]: () => {},
  };
}
