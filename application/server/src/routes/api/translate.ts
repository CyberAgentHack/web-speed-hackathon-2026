import { Router } from "express";
import httpErrors from "http-errors";
import { translate } from "@vitalets/google-translate-api";

export const translateRouter = Router();

translateRouter.post("/translate", async (req, res) => {
  const { text, sourceLang, targetLang } = req.body as {
    text?: string;
    sourceLang?: string;
    targetLang?: string;
  };

  if (typeof text !== "string" || typeof sourceLang !== "string" || typeof targetLang !== "string") {
    throw new httpErrors.BadRequest();
  }

  const result = await translate(text, { from: sourceLang, to: targetLang });

  return res.status(200).type("application/json").send({ result: result.text });
});
