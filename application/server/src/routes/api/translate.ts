import { translate } from "@vitalets/google-translate-api";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import type { AppEnv } from "@web-speed-hackathon-2026/server/src/types";

export const translateRouter = new Hono<AppEnv>();

translateRouter.post("/translate", async (c) => {
  const body = await c.req.json();
  const { text, sourceLanguage, targetLanguage } = body as {
    text?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
  };

  if (!text || !sourceLanguage || !targetLanguage) {
    throw new HTTPException(400, { message: "text, sourceLanguage, targetLanguage are required" });
  }

  const { text: result } = await translate(text, { from: sourceLanguage, to: targetLanguage });
  return c.json({ result }, 200);
});
