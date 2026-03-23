import { Router } from "express";
import httpErrors from "http-errors";

export const translateRouter = Router();

translateRouter.post("/translate", async (req, res) => {
  const { text, sourceLang, targetLang } = req.body as {
    text?: string;
    sourceLang?: string;
    targetLang?: string;
  };

  if (!text || !sourceLang || !targetLang) {
    throw new httpErrors.BadRequest("text, sourceLang, targetLang are required");
  }

  try {
    const params = new URLSearchParams({
      q: text,
      langpair: `${sourceLang}|${targetLang}`,
    });
    const response = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`);
    const data = (await response.json()) as { responseData?: { translatedText?: string } };
    const translated = data.responseData?.translatedText ?? text;
    res.json({ result: translated });
  } catch {
    res.json({ result: text });
  }
});
