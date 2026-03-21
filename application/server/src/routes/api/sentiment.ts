import { readFileSync } from "node:fs";
import path from "node:path";

import { Router } from "express";

import { getTokenizer } from "@web-speed-hackathon-2026/server/src/utils/tokenizer";

interface DictEntry {
  surface: string;
  reading: string;
  pos: string;
  rank: number;
}

const POSI_COUNT = 5122;
const NEGA_COUNT = 49983;
const NEGATIVE_CORRECTION = POSI_COUNT / NEGA_COUNT;

const dictPath = path.resolve(import.meta.dirname, "../../data/pn_ja.dic.json");
const posiNegaDict: DictEntry[] = JSON.parse(readFileSync(dictPath, "utf-8"));

function analyzeSentiment(tokens: { surface_form: string; reading?: string; pos: string }[]): number {
  if (tokens.length === 0) return 0;

  let score = 0;
  for (const token of tokens) {
    const found = posiNegaDict.find(
      (dict) => dict.surface === token.surface_form && dict.reading === (token.reading ?? ""),
    );
    if (found) {
      const rank = found.rank;
      if (rank > 0) {
        score += rank;
      } else if (rank < 0) {
        score += rank * NEGATIVE_CORRECTION;
      }
    }
  }
  return score / tokens.length;
}

export const sentimentRouter = Router();

sentimentRouter.get("/sentiment", async (req, res) => {
  const raw = typeof req.query["text"] === "string" ? req.query["text"].trim() : "";
  const text = raw.slice(0, 200);

  if (!text) {
    return res.status(200).type("application/json").send({ score: 0, label: "neutral" });
  }

  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(text);
  const score = analyzeSentiment(tokens);

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
