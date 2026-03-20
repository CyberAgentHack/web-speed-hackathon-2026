interface Translator {
  translate(text: string): Promise<string>;
  [Symbol.dispose](): void;
}

interface Params {
  sourceLanguage: string;
  targetLanguage: string;
}

export async function createNewTranslator(params: Params): Promise<Translator> {
  // @ts-expect-error
  const translator = (await Translator.create({
    sourceLanguage: params.sourceLanguage,
    targetLanguage: params.targetLanguage,
    monitor(m: any) {
      m.addEventListener("downloadprogress", (e: any) => {
        console.log(`Downloaded ${e.loaded * 100}%`);
      });
    },
  })) as Translator;
  return translator;
}

let translatorInstance: Translator | null = null;
const translateCache = new Map<string, string>();
export const translate = async (text: string, params: Params) => {
  const cacheKey = `${params.sourceLanguage}:${params.targetLanguage}:${text}`;
  if (translateCache.has(cacheKey)) {
    return translateCache.get(cacheKey)!;
  }

  if (!translatorInstance) {
    translatorInstance = await createNewTranslator(params);
  }

  const result = await translatorInstance.translate(text);
  translateCache.set(cacheKey, result);
  return result;
};
