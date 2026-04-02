import { Router } from "express";
import httpErrors from "http-errors";

export const translateRouter = Router();

translateRouter.post("/translate", async (req, res) => {
  const sourceLanguage = String(req.body?.sourceLanguage || "").trim();
  const targetLanguage = String(req.body?.targetLanguage || "").trim();
  const text = String(req.body?.text || "");

  if (!sourceLanguage || !targetLanguage || !text) {
    throw new httpErrors.BadRequest("sourceLanguage, targetLanguage, text are required");
  }

  if (sourceLanguage === targetLanguage) {
    return res.status(200).type("application/json").send({ result: text });
  }

  // Remote translator API (public, rate-limited). Fallback to the original text.
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(
      sourceLanguage,
    )}|${encodeURIComponent(targetLanguage)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`translation API error: ${response.status}`);
    }

    const payload = await response.json();
    const result = payload?.responseData?.translatedText;

    if (!result || typeof result !== "string") {
      throw new Error(`unexpected translation API payload: ${JSON.stringify(payload)}`);
    }

    return res.status(200).type("application/json").send({ result });
  } catch (err) {
    console.error("server translation failed:", err);
    // Do not fail the whole app due to translation errors, return fallback text.
    return res.status(200).type("application/json").send({ result: text });
  }
});
