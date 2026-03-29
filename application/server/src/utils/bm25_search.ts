import { BM25 } from "bayesian-bm25";
import type { Tokenizer, IpadicFeatures } from "kuromoji";
import _ from "lodash";

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
): { suggestions: string[]; queryTokens: string[] } {
  if (queryTokens.length === 0) return { suggestions: [], queryTokens: [] };

  const bm25 = new BM25({ k1: 1.2, b: 0.75 });

  const tokenizedCandidates = candidates.map((c) => extractTokens(tokenizer.tokenize(c)));
  bm25.index(tokenizedCandidates);

  const results = _.zipWith(candidates, bm25.getScores(queryTokens), (text, score) => {
    return { text, score };
  });

  const suggestions = _(results)
    .filter((s) => s.score > 0)
    .sortBy(["score"])
    .slice(-10)
    .map((s) => s.text)
    .value();

  return { suggestions, queryTokens };
}
