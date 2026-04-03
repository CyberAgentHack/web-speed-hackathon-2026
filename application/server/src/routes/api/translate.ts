import { Router } from "express";
import httpErrors from "http-errors";

export const translateRouter = Router();

translateRouter.post("/translate", async (req, res) => {
  const { text, source, target } = req.body;

  if (typeof text !== "string" || typeof source !== "string" || typeof target !== "string") {
    throw new httpErrors.BadRequest();
  }

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
    const response = await fetch(url);
    const data = await response.json() as { responseData?: { translatedText?: string } };
    const translatedText = data.responseData?.translatedText ?? text;

    return res.status(200).type("application/json").send({ result: translatedText });
  } catch {
    return res.status(200).type("application/json").send({ result: text });
  }
});
