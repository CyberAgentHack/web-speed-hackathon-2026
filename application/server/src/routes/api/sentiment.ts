import { Router } from "express";

import { analyzeSentiment } from "@web-speed-hackathon-2026/server/src/utils/analyze_sentiment";

export const sentimentRouter = Router();

sentimentRouter.get("/sentiment", async (req, res) => {
  const text = req.query["text"];

  if (typeof text !== "string" || text.trim() === "") {
    return res.status(200).type("application/json").send({ score: 0, label: "neutral" });
  }

  const result = await analyzeSentiment(text);
  return res.status(200).type("application/json").send(result);
});
