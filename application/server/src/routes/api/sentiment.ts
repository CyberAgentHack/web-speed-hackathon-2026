import { Router } from "express";
import httpErrors from "http-errors";
import analyze from "negaposi-analyzer-ja";

import { tokenizerPromise } from "@web-speed-hackathon-2026/server/src/utils/kuromoji_tokenizer.js";

export const sentimentRouter = Router();

sentimentRouter.post("/sentiment", async (req, res) => {
  const { text } = req.body as { text?: string };
  if (typeof text !== "string" || text.trim() === "") {
    throw new httpErrors.BadRequest("text is required");
  }

  const tokenizer = await tokenizerPromise;
  const tokens = tokenizer.tokenize(text);
  const score = analyze(tokens);

  let label: "positive" | "negative" | "neutral";
  if (score > 0.1) label = "positive";
  else if (score < -0.1) label = "negative";
  else label = "neutral";

  return res.status(200).type("application/json").send({ label, score });
});
