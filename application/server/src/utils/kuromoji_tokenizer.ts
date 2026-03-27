import { createRequire } from "node:module";
import path from "node:path";

import { BM25 } from "bayesian-bm25";
import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";

const require = createRequire(import.meta.url);
const dicPath = path.join(path.dirname(require.resolve("kuromoji/package.json")), "dict");

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
  if (queryTokens.length === 0 || candidates.length === 0) return [];

  const bm25 = new BM25({ k1: 1.2, b: 0.75 });
  const tokenizedCandidates = candidates.map((c) => extractTokens(tokenizer.tokenize(c)));
  bm25.index(tokenizedCandidates);

  const scored = candidates
    .map((text, i) => ({ text, score: bm25.getScores(queryTokens)[i] ?? 0 }))
    .filter((s) => s.score > 0)
    .sort((a, b) => a.score - b.score)
    .slice(-10)
    .map((s) => s.text);

  return scored;
}

export const tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> = new Promise(
  (resolve, reject) => {
    kuromoji.builder({ dicPath }).build((err, tokenizer) => {
      if (err) reject(err);
      else resolve(tokenizer);
    });
  },
);
