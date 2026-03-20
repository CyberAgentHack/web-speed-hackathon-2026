import { createRequire } from "node:module";
import path from "node:path";

import { Router } from "express";
import kuromoji from "kuromoji";
import type { Tokenizer, IpadicFeatures } from "kuromoji";

const require = createRequire(import.meta.url);
const DICT_PATH = path.join(path.dirname(require.resolve("kuromoji/package.json")), "dict");

export const sentimentRouter = Router();

type Analyze = ((tokens: IpadicFeatures[]) => number) & {
  default?: (tokens: IpadicFeatures[]) => number;
};

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;
let analyzePromise: Promise<(tokens: IpadicFeatures[]) => number> | null = null;

function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  tokenizerPromise ??= new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: DICT_PATH }).build((err, tokenizer) => {
      if (err) reject(err);
      else resolve(tokenizer);
    });
  });
  return tokenizerPromise;
}

async function getAnalyze(): Promise<(tokens: IpadicFeatures[]) => number> {
  analyzePromise ??= import("negaposi-analyzer-ja").then((mod) => {
    const analyze = mod as Analyze;
    return analyze.default ?? analyze;
  });
  return analyzePromise;
}

sentimentRouter.post("/sentiment", async (req, res) => {
  const { text } = req.body as { text?: string };
  if (typeof text !== "string" || text.trim() === "") {
    return res.status(200).json({ score: 0, label: "neutral" });
  }

  const [tokenizer, analyze] = await Promise.all([getTokenizer(), getAnalyze()]);
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
