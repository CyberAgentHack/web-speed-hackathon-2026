import { pipeline, env, type TranslationPipeline } from "@xenova/transformers";

let translationPipeline: TranslationPipeline | null = null;

export async function initializeTranslator(): Promise<void> {
  env.allowLocalModels = true;
  translationPipeline = await pipeline("translation", "Xenova/opus-mt-ja-en");
  console.log("Translation model loaded.");
}

export async function translateJaToEn(text: string): Promise<string> {
  if (translationPipeline === null) {
    throw new Error("Translator is not initialized.");
  }
  const result = await translationPipeline(text);
  const output = Array.isArray(result) ? result : [result];
  const first = output[0] as { translation_text: string };
  return first.translation_text;
}
