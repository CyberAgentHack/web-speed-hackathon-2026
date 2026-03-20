import { BM25 } from "bayesian-bm25";
import type { Tokenizer, IpadicFeatures } from "kuromoji";
import { filter, map, sortBy, zipWith } from "lodash-es";

const STOP_POS = new Set(["助詞", "助動詞", "記号"]);

/**
 * 形態素解析で内容語トークン（名詞、動詞、形容詞など）を抽出
 */
export function extractTokens(tokens: IpadicFeatures[]): string[] {
  return tokens
    .filter((t) => t.surface_form !== "" && t.pos !== "" && !STOP_POS.has(t.pos))
    .map((t) => t.surface_form.toLowerCase());
}

/**
 * BM25で候補をスコアリングして、クエリと類似度の高い上位10件を返す
 */
export function filterSuggestionsBM25(
  tokenizer: Tokenizer<IpadicFeatures>,
  candidates: string[],
  queryTokens: string[],
): string[] {
  if (queryTokens.length === 0) return [];

  const bm25 = new BM25({ k1: 1.2, b: 0.75 });

  const tokenizedCandidates = candidates.map((c) => extractTokens(tokenizer.tokenize(c)));
  bm25.index(tokenizedCandidates);

  const results = zipWith(candidates, bm25.getScores(queryTokens), (text, score) => {
    return { text, score };
  });

  const filtered = filter(results, (s) => s.score > 0);
  const sorted = sortBy(filtered, ["score"]);
  return map(sorted.slice(-10), (s) => s.text);
}
