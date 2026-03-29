import { Router } from "express";
import httpErrors from "http-errors";
import translate from "google-translate-api-x";

export const translateRouter = Router();

/**
 * テキスト翻訳API。
 * クライアント側Web LLM（数GB）の代わりにサーバーサイドで翻訳を行い、
 * パフォーマンスと信頼性を改善する。
 */
translateRouter.post("/translate", async (req, res) => {
  const { text, targetLanguage } = req.body as {
    text?: string;
    targetLanguage?: string;
  };

  if (!text || typeof text !== "string") {
    throw new httpErrors.BadRequest("text is required");
  }

  const target = targetLanguage ?? "en";

  const result = await translate(text, { to: target });

  return res.status(200).type("application/json").send({
    result: result.text,
  });
});
