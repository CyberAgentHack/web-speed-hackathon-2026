import { pipeline, type TranslationPipeline } from "@huggingface/transformers";
import { Hono } from "hono";
import * as v from "valibot";

import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";

const TranslateBody = v.object({
  text: v.string(),
  source: v.string(),
  target: v.string(),
});

let translator: TranslationPipeline | null = null;

async function getTranslator(): Promise<TranslationPipeline> {
  if (!translator) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pipeline() produces overly complex union type
    translator = await (pipeline as any)("translation", "Xenova/opus-mt-ja-en", {
      dtype: "q8",
    });
  }
  return translator!;
}

export const translateRouter = new Hono<SessionEnv>().post("/translate", async (c) => {
  const body = v.parse(TranslateBody, await c.req.json());

  try {
    const t = await getTranslator();
    const result = await t(body.text);
    const translated = (result as { translation_text: string }[])[0]!.translation_text;
    return c.json({ result: translated });
  } catch (e) {
    console.error("Translation error:", e);
    return c.json({ error: "Translation failed" }, 500);
  }
});
