import { Router } from "express";
import analyze from "negaposi-analyzer-ja";

import { getTokenizer } from "@web-speed-hackathon-2026/server/src/utils/tokenizer.js";

export const sentimentRouter = Router();

sentimentRouter.get("/sentiment", async (req, res) => {
  const text = req.query["text"];

  if (typeof text !== "string" || text.trim() === "") {
    return res.status(200).json({ score: 0, label: "neutral" });
  }

  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(text);
  const score = analyze(tokens);

  let label: "positive" | "negative" | "neutral";
  if (score > 0.1) {
    label = "positive";
  } else if (score < -0.1) {
    label = "negative";
  } else {
    label = "neutral";
  }

  return res.status(200).json({ score, label });
});
