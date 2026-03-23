import { CreateMLCEngine } from "@mlc-ai/web-llm";
import { stripIndents } from "common-tags";
import * as JSONRepairJS from "json-repair-js";
import langs from "langs";
import invariant from "tiny-invariant";

interface Translator {
  translate(text: string): Promise<string>;
}

interface Params {
  sourceLanguage: string;
  targetLanguage: string;
}

interface BuiltInTranslator {
  translate(text: string): Promise<string>;
}

interface BrowserAI {
  ai?: {
    translator?: {
      create?(params: Params): Promise<BuiltInTranslator>;
    };
  };
}

const MODEL_IDS = [
  "Qwen2.5-0.5B-Instruct-q4f32_1-MLC",
  "Qwen2-0.5B-Instruct-q4f16_1-MLC",
  "gemma-2-2b-jpn-it-q4f16_1-MLC",
] as const;

let enginePromise: Promise<Awaited<ReturnType<typeof CreateMLCEngine>>> | null = null;

async function getEngine() {
  if (enginePromise == null) {
    enginePromise = (async () => {
      let lastError: unknown;

      for (const modelId of MODEL_IDS) {
        try {
          return await CreateMLCEngine(modelId);
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError ?? new Error("Failed to initialize the translation engine.");
    })().catch((error) => {
      enginePromise = null;
      throw error;
    });
  }

  return enginePromise;
}

export async function createTranslator(params: Params): Promise<Translator> {
  const browserTranslator = await createBuiltInTranslator(params);
  if (browserTranslator != null) {
    return browserTranslator;
  }

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

      const parsed = JSONRepairJS.loads(content);
      invariant(
        parsed != null && "result" in parsed,
        "The translation result is missing in the reply.",
      );

      return String(parsed.result);
    },
  };
}

async function createBuiltInTranslator(params: Params): Promise<Translator | null> {
  const ai = (window as BrowserAI).ai;

  if (ai?.translator?.create == null) {
    return null;
  }

  const translator = await ai.translator.create(params);
  return {
    async translate(text: string): Promise<string> {
      return translator.translate(text);
    },
  };
}
