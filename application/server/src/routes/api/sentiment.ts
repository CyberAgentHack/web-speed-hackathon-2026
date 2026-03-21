import { Router } from "express";
import kuromoji, { type Tokenizer, type IpadicFeatures } from "kuromoji";
// @ts-expect-error -- no type declarations available
import analyze from "negaposi-analyzer-ja";

export const sentimentRouter = Router();

let cachedTokenizer: Tokenizer<IpadicFeatures> | null = null;
let pendingPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

export function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (cachedTokenizer) return Promise.resolve(cachedTokenizer);
  if (pendingPromise) return pendingPromise;

  pendingPromise = new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
    kuromoji.builder({ dicPath: "node_modules/kuromoji/dict" }).build((err, tokenizer) => {
      if (err) {
        pendingPromise = null;
        reject(err);
      } else {
        cachedTokenizer = tokenizer;
        resolve(tokenizer);
      }
    });
  });

  return pendingPromise;
}

sentimentRouter.get("/sentiment", async (req, res) => {
  const text = req.query["text"];
  if (typeof text !== "string" || text.trim() === "") {
    res.json({ score: 0, label: "neutral" });
    return;
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

  res.json({ score, label });
});
