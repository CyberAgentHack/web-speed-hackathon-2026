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

  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", sourceLanguage);
  url.searchParams.set("tl", targetLanguage);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new httpErrors.BadGateway("Translation service unavailable");
  }

  const data = (await response.json()) as unknown[][];
  const translated = (data[0] as unknown[][])
    .map((item) => item[0])
    .filter(Boolean)
    .join("");

  res.json({ result: translated });
});
