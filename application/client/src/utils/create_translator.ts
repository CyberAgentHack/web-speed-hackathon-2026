interface Translator {
  translate(text: string): Promise<string>;
  [Symbol.dispose](): void;
}

interface Params {
  sourceLanguage: string;
  targetLanguage: string;
}

// エンジンをキャッシュして毎回ロードし直さないようにする
let cachedEngine: Awaited<ReturnType<import("@mlc-ai/web-llm")["CreateMLCEngine"]>> | null = null;
let engineLoadingPromise: Promise<typeof cachedEngine> | null = null;

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
    { default: invariant },
  ] = await Promise.all([
    import("common-tags"),
    import("json-repair-js"),
    import("langs"),
    import("tiny-invariant"),
  ]);

  const sourceLang = langs.where("1", params.sourceLanguage);
  invariant(sourceLang, `Unsupported source language code: ${params.sourceLanguage}`);

  const targetLang = langs.where("1", params.targetLanguage);
  invariant(targetLang, `Unsupported target language code: ${params.targetLanguage}`);

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
      invariant(content, "No content in the reply from the translation engine.");

      const parsed = loads(content);
      invariant(
        parsed != null && "result" in parsed,
        "The translation result is missing in the reply.",
      );

      return String(parsed.result);
    },
    [Symbol.dispose]: () => {
      // エンジンはキャッシュするためアンロードしない
    },
  };
}
