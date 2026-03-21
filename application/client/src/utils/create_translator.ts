interface Translator {
  translate(text: string): Promise<string>;
  [Symbol.dispose](): void;
}

interface Params {
  sourceLanguage: string;
  targetLanguage: string;
}

// エンジンをキャッシュして毎回ロードし直さないようにする
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedEngine: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let engineLoadingPromise: Promise<any> | null = null;

async function getEngine() {
  if (cachedEngine) return cachedEngine;
  if (!engineLoadingPromise) {
    engineLoadingPromise = (async () => {
      const { CreateMLCEngine } = await import("@mlc-ai/web-llm");
      cachedEngine = await CreateMLCEngine("gemma-2-2b-jpn-it-q4f16_1-MLC");
      return cachedEngine;
    })();
  }
  return engineLoadingPromise;
}

export async function createTranslator(params: Params): Promise<Translator> {
  const [
    { stripIndents },
    { loads },
    { default: langs },
  ] = await Promise.all([
    import("common-tags"),
    import("json-repair-js"),
    import("langs"),
  ]);

  const sourceLang = langs.where("1", params.sourceLanguage);
  if (!sourceLang) throw new Error(`Unsupported source language code: ${params.sourceLanguage}`);

  const targetLang = langs.where("1", params.targetLanguage);
  if (!targetLang) throw new Error(`Unsupported target language code: ${params.targetLanguage}`);

  const engine = await getEngine();

  return {
    async translate(text: string): Promise<string> {
      const reply = await engine.chat.completions.create({
        messages: [
          {
            role: "system",
            content: stripIndents`
              You are a professional translator. Translate the following text from ${sourceLang.name} to ${targetLang.name}.
              Provide as JSON only in the format: { "result": "{{translated text}}" } without any additional explanations.
            `,
          },
          {
            role: "user",
            content: text,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
      });

      const content = reply.choices[0]!.message.content;
      if (!content) throw new Error("No content in the reply from the translation engine.");

      const parsed = loads(content);
      if (parsed == null || !("result" in parsed)) {
        throw new Error("The translation result is missing in the reply.");
      }

      return String((parsed as Record<string, unknown>)["result"]);
    },
    [Symbol.dispose]: () => {
      // エンジンはキャッシュするためアンロードしない
    },
  };
}
