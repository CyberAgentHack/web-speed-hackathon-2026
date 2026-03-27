import { CreateMLCEngine } from "@mlc-ai/web-llm";
import { stripIndents } from "common-tags";
import langs from "langs";
import invariant from "tiny-invariant";

function parseTranslationResult(content: string): string {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");

  if (start >= 0 && end > start) {
    const candidate = content.slice(start, end + 1);
    try {
      const parsed = JSON.parse(candidate) as { result?: unknown };
      if (typeof parsed.result === "string") {
        return parsed.result;
      }
    } catch {
      // noop
    }
  }

  try {
    const parsed = JSON.parse(content) as { result?: unknown };
    if (typeof parsed.result === "string") {
      return parsed.result;
    }
  } catch {
    // noop
  }

  throw new Error("The translation result is missing in the reply.");
}

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

      return parseTranslationResult(content);
    },
    [Symbol.dispose]: () => {
      engine.unload();
    },
  };
}
