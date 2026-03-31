import { Router } from "express";
import httpErrors from "http-errors";

import { analyzeSentiment } from "@web-speed-hackathon-2026/server/src/utils/analyze_sentiment";

export const sentimentRouter = Router();

sentimentRouter.post("/sentiment", async (req, res) => {
  const text = req.body?.text;

  if (typeof text !== "string" || text.trim() === "") {
    throw new httpErrors.BadRequest("text is required.");
  }

  const result = await analyzeSentiment(text);

  return res.status(200).type("application/json").send(result);
});
