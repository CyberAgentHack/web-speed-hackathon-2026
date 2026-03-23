import { BM25 } from "bayesian-bm25";
import type { Tokenizer, IpadicFeatures } from "kuromoji";
import _ from "lodash";

const STOP_POS = new Set(["助詞", "助動詞", "記号"]);
const BM25_OPTIONS = { k1: 1.2, b: 0.75 };
const MAX_SUGGESTION_COUNT = 10;

export type SuggestionSearcher = (queryTokens: string[]) => string[];

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
  const search = createSuggestionSearcher(tokenizer, candidates);
  return search(queryTokens);
}

/**
 * 候補データを前処理して、クエリごとに再利用できる検索関数を返す
 */
export function createSuggestionSearcher(
  tokenizer: Tokenizer<IpadicFeatures>,
  candidates: string[],
): SuggestionSearcher {
  const bm25 = new BM25(BM25_OPTIONS);
  const tokenizedCandidates = candidates.map((candidate) => extractTokens(tokenizer.tokenize(candidate)));
  bm25.index(tokenizedCandidates);

  return (queryTokens: string[]) => {
    return rankSuggestions(candidates, bm25.getScores(queryTokens), queryTokens);
  };
}

function rankSuggestions(candidates: string[], scores: number[], queryTokens: string[]): string[] {
  if (queryTokens.length === 0) return [];
  const results = _.zipWith(candidates, scores, (text, score) => ({ text, score: score ?? 0 }));

  // スコアが高い（＝類似度が高い）ものが下に来るように、上位10件を取得する
  return _(results)
    .filter((s) => s.score > 0)
    .sortBy(["score"])
    .slice(-MAX_SUGGESTION_COUNT)
    .map((s) => s.text)
    .value();
}
