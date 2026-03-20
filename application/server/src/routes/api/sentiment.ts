import path from "node:path";

import { Router } from "express";
import kuromoji, { type Tokenizer, type IpadicFeatures } from "kuromoji";
// @ts-expect-error -- no types
import analyze from "negaposi-analyzer-ja";

export const sentimentRouter = Router();

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji
        .builder({ dicPath: path.resolve("node_modules/kuromoji/dict") })
        .build((err, tokenizer) => {
          if (err) reject(err);
          else resolve(tokenizer);
        });
    });
  }
  return tokenizerPromise;
}

sentimentRouter.get("/sentiment", async (req, res) => {
  const raw = typeof req.query["text"] === "string" ? req.query["text"].trim() : "";
  const text = raw.slice(0, 200);

  if (!text) {
    return res.status(200).type("application/json").send({ score: 0, label: "neutral" });
  }

  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(text);
  const score: number = analyze(tokens);

  let label: "positive" | "negative" | "neutral";
  if (score > 0.1) {
    label = "positive";
  } else if (score < -0.1) {
    label = "negative";
  } else {
    label = "neutral";
  }

  return res.status(200).type("application/json").send({ score, label });
});
