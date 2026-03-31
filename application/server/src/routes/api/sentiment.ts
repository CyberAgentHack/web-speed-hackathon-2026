import { Router } from "express";

import { analyzeSentiment } from "@web-speed-hackathon-2026/server/src/utils/nlp";

export const sentimentRouter = Router();

sentimentRouter.get("/sentiment", async (req, res) => {
  const text = typeof req.query["text"] === "string" ? req.query["text"].trim() : "";

  if (!text) {
    res.json({ score: 0, label: "neutral" });
    return;
  }

  const result = await analyzeSentiment(text);
  res.json(result);
});
