import { Router } from "express";
import httpErrors from "http-errors";

import { translateText } from "@web-speed-hackathon-2026/server/src/utils/translate_text";

export const translateRouter = Router();

translateRouter.post("/translate", async (req, res) => {
  const text = req.body?.text;
  const sourceLanguage = req.body?.sourceLanguage;
  const targetLanguage = req.body?.targetLanguage;

  if (typeof text !== "string" || text.trim() === "") {
    throw new httpErrors.BadRequest("text is required.");
  }
  if (typeof sourceLanguage !== "string" || sourceLanguage.trim() === "") {
    throw new httpErrors.BadRequest("sourceLanguage is required.");
  }
  if (typeof targetLanguage !== "string" || targetLanguage.trim() === "") {
    throw new httpErrors.BadRequest("targetLanguage is required.");
  }

  const result = await translateText({
    sourceLanguage,
    targetLanguage,
    text,
  });

  return res.status(200).type("application/json").send({ result });
});
