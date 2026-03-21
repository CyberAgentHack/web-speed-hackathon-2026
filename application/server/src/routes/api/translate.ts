import { Router } from "express";

export const translateRouter = Router();

const GOOGLE_TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single";

async function translateText(text: string, source: string, target: string): Promise<string> {
  const params = new URLSearchParams({
    client: "gtx",
    sl: source,
    tl: target,
    dt: "t",
    q: text,
  });

  const response = await fetch(`${GOOGLE_TRANSLATE_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`Translation failed: ${response.status}`);
  }

  const data = await response.json();
  // Google Translate returns [[["translated text","original text",...],...],...]
  const sentences = data[0] as Array<[string, string]>;
  return sentences.map((s) => s[0]).join("");
}

translateRouter.post("/translate", async (req, res) => {
  const { text, sourceLanguage, targetLanguage } = req.body as {
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
  };

  if (!text || !sourceLanguage || !targetLanguage) {
    return res.status(400).json({ message: "text, sourceLanguage, targetLanguage are required" });
  }

  try {
    const result = await translateText(text, sourceLanguage, targetLanguage);
    return res.json({ result });
  } catch {
    return res.status(502).json({ message: "Translation service unavailable" });
  }
});
