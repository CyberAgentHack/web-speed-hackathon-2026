import * as deepl from "deepl-node";
import { Router } from "express";
import httpErrors from "http-errors";

interface TranslateRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export const translateRouter = Router();

const deeplAuthKey = process.env["DEEPL_AUTH_KEY"] || "";
let translator: deepl.Translator | null = null;
if (deeplAuthKey) {
  translator = new deepl.Translator(deeplAuthKey);
}

// Simple in-memory cache to store translated texts
const translationCache = new Map<string, string>();

translateRouter.post("/translate", async (req, res) => {
  const { text, sourceLanguage, targetLanguage } = req.body as TranslateRequest;
  if (!text || !targetLanguage) {
    throw new httpErrors.BadRequest("Missing required fields");
  }

  const targetLangCode = targetLanguage.toUpperCase() === "EN" ? "EN-US" : targetLanguage.toUpperCase();
  const sourceLangCode = sourceLanguage ? sourceLanguage.toUpperCase() : null;

  // Create a unique cache key based on the input text and languages
  const cacheKey = `${text}::${sourceLangCode || "AUTO"}::${targetLangCode}`;
  
  if (translationCache.has(cacheKey)) {
    return res.status(200).json({ result: translationCache.get(cacheKey) });
  }

  if (!translator) {
    console.warn("DEEPL_AUTH_KEY is not set. Returning original text.");
    return res.status(200).json({ result: text });
  }

  try {
    const result = await translator.translateText(
      text,
      sourceLangCode as deepl.SourceLanguageCode | null,
      targetLangCode as deepl.TargetLanguageCode,
    );

    // Save the result to cache
    translationCache.set(cacheKey, result.text);

    return res.status(200).json({ result: result.text });
  } catch (error) {
    console.error("DeepL Translation error:", error);
    throw new httpErrors.InternalServerError("Translation failed");
  }
});
