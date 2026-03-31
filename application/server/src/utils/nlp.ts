import path from "node:path";

import { BM25 } from "bayesian-bm25";
import type { IpadicFeatures, Tokenizer } from "kuromoji";

import { PUBLIC_PATH } from "@web-speed-hackathon-2026/server/src/paths";

let tokenizerInstance: Tokenizer<IpadicFeatures> | null = null;

export async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (tokenizerInstance) return tokenizerInstance;

  const kuromoji = await import("kuromoji");
  const dicPath = path.resolve(PUBLIC_PATH, "dicts");

  return new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
    kuromoji.default.builder({ dicPath }).build((err, tokenizer) => {
      if (err) reject(err);
      else {
        tokenizerInstance = tokenizer;
        resolve(tokenizer);
      }
    });
  });
}

const STOP_POS = new Set(["助詞", "助動詞", "記号"]);

export function extractTokens(tokens: IpadicFeatures[]): string[] {
  return tokens
    .filter((t) => t.surface_form !== "" && t.pos !== "" && !STOP_POS.has(t.pos))
    .map((t) => t.surface_form.toLowerCase());
}

export function filterSuggestionsBM25(
  tokenizer: Tokenizer<IpadicFeatures>,
  candidates: string[],
  queryTokens: string[],
): string[] {
  if (queryTokens.length === 0) return [];

  const bm25 = new BM25({ k1: 1.2, b: 0.75 });

  const tokenizedCandidates = candidates.map((c) => extractTokens(tokenizer.tokenize(c)));
  bm25.index(tokenizedCandidates);

  const scores = bm25.getScores(queryTokens);
  const results = candidates.map((text, i) => ({ text, score: scores[i]! }));

  return results
    .filter((s) => s.score > 0)
    .sort((a, b) => a.score - b.score)
    .slice(-10)
    .map((s) => s.text);
}

type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const { default: analyze } = await import("negaposi-analyzer-ja");
  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(text);

  const score = analyze(tokens);

  let label: SentimentResult["label"];
  if (score > 0.1) {
    label = "positive";
  } else if (score < -0.1) {
    label = "negative";
  } else {
    label = "neutral";
  }

  return { score, label };
}
