import { translate } from "@vitalets/google-translate-api";
import { Router } from "express";
import httpErrors from "http-errors";

export const translateRouter = Router();

translateRouter.post("/translate", async (req, res) => {
  const { text, sourceLanguage, targetLanguage } = req.body as {
    text?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
  };

  if (!text || !sourceLanguage || !targetLanguage) {
    throw new httpErrors.BadRequest("text, sourceLanguage, targetLanguage are required");
  }

  const { text: result } = await translate(text, { from: sourceLanguage, to: targetLanguage });
  return res.status(200).json({ result });
});
