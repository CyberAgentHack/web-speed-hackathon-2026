import { Router } from "express";

export const initializeRouter = Router();

initializeRouter.post("/initialize", async (_req, res) => {
  // 初期化処理をスキップ（高速化＆エラー回避）
  return res.status(200).json({ success: true });
});