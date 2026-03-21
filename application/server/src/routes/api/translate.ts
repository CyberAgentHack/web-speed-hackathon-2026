import { Router } from "express";
import translate from "google-translate-api-x";
import httpErrors from "http-errors";

export const translateRouter = Router();

translateRouter.post("/translate", async (req, res) => {
  const { text, sourceLanguage, targetLanguage } = req.body as {
    text?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
  };

  if (!text || !sourceLanguage || !targetLanguage) {
    throw new httpErrors.BadRequest("text, sourceLanguage, and targetLanguage are required.");
  }

  try {
    const result = await translate(text, { from: sourceLanguage, to: targetLanguage });
    return res.status(200).type("application/json").send({ result: result.text });
  } catch (err) {
    console.error("Translation error:", err);
    throw new httpErrors.BadGateway("Translation failed.");
  }
});
