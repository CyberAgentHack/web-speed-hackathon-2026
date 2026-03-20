import { Router } from "express";

export const translateRouter = Router();

translateRouter.post("/translate", async (req, res) => {
  const { text, sourceLanguage, targetLanguage } = req.body as {
    text?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
  };

  if (!text || !sourceLanguage || !targetLanguage) {
    return res.status(400).json({ error: "text, sourceLanguage, targetLanguage are required" });
  }

  // WebGPU LLM (@mlc-ai/web-llm) はサーバーサイドでは利用不可。
  // 将来的に別の翻訳バックエンドに差し替え可能なエンドポイントとして提供。
  return res.status(200).json({ result: text });
});
