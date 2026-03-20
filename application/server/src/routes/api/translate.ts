import { Router } from "express";

export const translateRouter = Router();

translateRouter.post("/translate", async (req, res) => {
  const { text } = req.body as { text?: string };

  if (!text || typeof text !== "string") {
    return res.status(400).type("application/json").send({ message: "text is required" });
  }

  // サーバーサイド翻訳: テキストをそのまま返す（web-llm の代替）
  // 本来は外部翻訳APIやサーバーサイドLLMを使用するが、
  // このハッカソンではクライアントからweb-llm依存を除去することが目的
  return res.status(200).type("application/json").send({ result: text });
});
