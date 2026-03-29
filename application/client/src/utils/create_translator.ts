import { CreateMLCEngine } from "@mlc-ai/web-llm";
import { stripIndents } from "common-tags";
import * as JSONRepairJS from "json-repair-js";
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

let translatorPromise: Promise<Translator> | null = null;

export async function createTranslator(params: Params): Promise<Translator> {
  if (translatorPromise !== null) {
    return translatorPromise;
  }

  const sourceLang = langs.where("1", params.sourceLanguage);
  invariant(sourceLang, `Unsupported source language code: ${params.sourceLanguage}`);

  const targetLang = langs.where("1", params.targetLanguage);
  invariant(targetLang, `Unsupported target language code: ${params.targetLanguage}`);

  translatorPromise = (async () => {
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
        // Reuse the loaded model across translations.
      },
    };
  })().catch((error) => {
    translatorPromise = null;
    throw error;
  });

  return translatorPromise;
}
