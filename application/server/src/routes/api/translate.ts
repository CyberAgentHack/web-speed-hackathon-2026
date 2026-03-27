import { Router } from "express";
import httpErrors from "http-errors";

export const translateRouter = Router();

translateRouter.post("/translate", async (req, res) => {
  const { text, source = "ja", target = "en" } = req.body as {
    text?: string;
    source?: string;
    target?: string;
  };

  if (typeof text !== "string" || text.trim() === "") {
    throw new httpErrors.BadRequest("text is required");
  }

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new httpErrors.BadGateway("Translation service unavailable");
  }

  const data = (await response.json()) as {
    responseStatus: number;
    responseData: { translatedText: string };
  };

  if (data.responseStatus !== 200) {
    throw new httpErrors.BadGateway("Translation failed");
  }

  return res.status(200).type("application/json").send({ result: data.responseData.translatedText });
});
