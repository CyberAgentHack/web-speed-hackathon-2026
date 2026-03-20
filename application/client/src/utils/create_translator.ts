import * as JSONRepairJS from "json-repair-js";
import langs from "langs";

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
  if (sourceLang == null) {
    throw new Error(`Unsupported source language code: ${params.sourceLanguage}`);
  }

  const targetLang = langs.where("1", params.targetLanguage);
  if (targetLang == null) {
    throw new Error(`Unsupported target language code: ${params.targetLanguage}`);
  }

  const { CreateMLCEngine } = await import("@mlc-ai/web-llm");
  const engine = await CreateMLCEngine("gemma-2-2b-jpn-it-q4f16_1-MLC");

  return {
    async translate(text: string): Promise<string> {
      const reply = await engine.chat.completions.create({
        messages: [
          {
            role: "system",
            content: [
              "You are a professional translator.",
              `Translate the following text from ${sourceLang.name} to ${targetLang.name}.`,
              'Provide as JSON only in the format: { "result": "{{translated text}}" } without any additional explanations.',
            ].join(" "),
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
      if (content == null) {
        throw new Error("No content in the reply from the translation engine.");
      }

      const parsed = JSONRepairJS.loads(content);
      if (parsed == null || !("result" in parsed)) {
        throw new Error("The translation result is missing in the reply.");
      }

      return String(parsed.result);
    },
    [Symbol.dispose]: () => {
      engine.unload();
    },
  };
}
