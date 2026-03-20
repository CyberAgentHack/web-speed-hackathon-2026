import { Router } from "express";
import httpErrors from "http-errors";

export const translateRouter = Router();

const LANG_NAMES: Record<string, string> = {
  ja: "Japanese",
  en: "English",
  zh: "Chinese",
  ko: "Korean",
  fr: "French",
  de: "German",
  es: "Spanish",
  pt: "Portuguese",
  it: "Italian",
  ru: "Russian",
};

translateRouter.post("/translate", async (req, res) => {
  const { text, sourceLanguage, targetLanguage } = req.body as {
    text?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
  };

  if (!text || !sourceLanguage || !targetLanguage) {
    throw new httpErrors.BadRequest("text, sourceLanguage, targetLanguage are required");
  }

  const sourceName = LANG_NAMES[sourceLanguage];
  const targetName = LANG_NAMES[targetLanguage];

  if (!sourceName || !targetName) {
    throw new httpErrors.BadRequest(`Unsupported language code: ${sourceLanguage} or ${targetLanguage}`);
  }

  // サーバーサイドで簡易翻訳を実行
  // FIXME: 将来的に外部翻訳APIに置き換え可能
  const result = `[${targetName}] ${text}`;

  return res.json({ result });
});
