import * as deepl from "deepl-node";
import { Router } from "express";

const DEEPL_API_KEY = process.env["DEEPL_API_KEY"] ?? "2e7438cb-315f-466d-8282-34f9b8113488:fx";

let translator: deepl.Translator | null = null;
function getTranslator(): deepl.Translator {
  if (!translator) {
    translator = new deepl.Translator(DEEPL_API_KEY);
  }
  return translator;
}

const TARGET_LANG_MAP: Record<string, deepl.TargetLanguageCode> = {
  en: "en-US",
  ja: "ja",
  de: "de",
  fr: "fr",
  es: "es",
  zh: "zh-hans",
  ko: "ko",
};

export const translateRouter = Router();

translateRouter.post("/translate", async (req, res) => {
  const { text, sourceLanguage, targetLanguage } = req.body as {
    text?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
  };

  if (!text || typeof text !== "string") {
    return res.status(400).type("application/json").send({ message: "text is required" });
  }

  if (!DEEPL_API_KEY) {
    return res.status(200).type("application/json").send({ result: text });
  }

  try {
    const targetLang = TARGET_LANG_MAP[targetLanguage ?? "en"] ?? "en-US";
    const sourceLang = sourceLanguage
      ? (TARGET_LANG_MAP[sourceLanguage] as deepl.SourceLanguageCode | undefined)
      : undefined;

    const result = await getTranslator().translateText(text, sourceLang ?? null, targetLang);
    return res.status(200).type("application/json").send({ result: result.text });
  } catch (e) {
    console.error("DeepL translation error:", e);
    return res.status(200).type("application/json").send({ result: text });
  }
});
