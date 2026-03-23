import { Router } from "express";
import httpErrors from "http-errors";


export const translateRouter = Router();

translateRouter.post("/translate", async (req, res) => {
  const { text, sourceLang = "ja", targetLang = "en" } = req.body as {
    text?: string;
    sourceLang?: string;
    targetLang?: string;
  };

  if (!text || typeof text !== "string") {
    throw new httpErrors.BadRequest("text is required");
  }

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new httpErrors.InternalServerError("Translation service unavailable");
  }

  const data = (await response.json()) as { responseData: { translatedText: string } };
  const translated = data.responseData.translatedText ?? "";

  return res.status(200).type("application/json").send({ result: translated });
});
