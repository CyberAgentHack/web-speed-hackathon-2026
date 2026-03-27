import invariant from "tiny-invariant";

interface Translator {
  translate(text: string): Promise<string>;
  [Symbol.dispose](): void;
}

interface Params {
  sourceLanguage: string;
  targetLanguage: string;
}

let depsCache: {
  CreateMLCEngine: typeof import("@mlc-ai/web-llm").CreateMLCEngine;
  stripIndents: typeof import("common-tags").stripIndents;
  JSONRepairJS: typeof import("json-repair-js");
  langs: typeof import("langs").default;
} | null = null;

async function loadDeps() {
  if (depsCache) return depsCache;
  const [webLlm, commonTags, jsonRepair, langsModule] = await Promise.all([
    import("@mlc-ai/web-llm"),
    import("common-tags"),
    import("json-repair-js"),
    import("langs").then((m) => m.default),
  ]);
  depsCache = {
    CreateMLCEngine: webLlm.CreateMLCEngine,
    stripIndents: commonTags.stripIndents,
    JSONRepairJS: jsonRepair,
    langs: langsModule,
  };
  return depsCache;
}

export async function createTranslator(params: Params): Promise<Translator> {
  const { CreateMLCEngine, stripIndents, JSONRepairJS, langs } = await loadDeps();

  const sourceLang = langs.where("1", params.sourceLanguage);
  invariant(sourceLang, `Unsupported source language code: ${params.sourceLanguage}`);

  const targetLang = langs.where("1", params.targetLanguage);
  invariant(targetLang, `Unsupported target language code: ${params.targetLanguage}`);

  const engine = await CreateMLCEngine("gemma-2-2b-jpn-it-q4f16_1-MLC");

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

      const parsed = JSONRepairJS.loads(content);
      invariant(
        parsed != null && "result" in parsed,
        "The translation result is missing in the reply.",
      );

      return String(parsed.result);
    },
    [Symbol.dispose]: () => {
      engine.unload();
    },
  };
}
