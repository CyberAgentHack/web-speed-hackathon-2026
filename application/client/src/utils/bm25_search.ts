import { BM25 } from "bayesian-bm25";
import _ from "lodash";

const STOP_WORDS = new Set([
  "の", "は", "が", "を", "に", "で", "と", "も", "へ", "や",
  "か", "な", "よ", "ね", "わ", "だ", "て", "た", "する", "ある",
  "いる", "この", "その", "あの", "どの", "こと", "もの", "ため",
]);

const segmenter = new Intl.Segmenter("ja", { granularity: "word" });

/**
 * Intl.Segmenter で内容語トークンを抽出
 */
export function extractTokensFromText(text: string): string[] {
  const segments = segmenter.segment(text);
  const tokens: string[] = [];
  for (const seg of segments) {
    if (seg.isWordLike && !STOP_WORDS.has(seg.segment)) {
      tokens.push(seg.segment.toLowerCase());
    }
  }
  return tokens;
}

/**
 * BM25で候補をスコアリングして、クエリと類似度の高い上位10件を返す
 */
export function filterSuggestionsBM25(
  candidates: string[],
  queryTokens: string[],
): string[] {
  if (queryTokens.length === 0) return [];

  const bm25 = new BM25({ k1: 1.2, b: 0.75 });

  const tokenizedCandidates = candidates.map((c) => extractTokensFromText(c));
  bm25.index(tokenizedCandidates);

  const results = _.zipWith(candidates, bm25.getScores(queryTokens), (text, score) => {
    return { text, score };
  });

  // スコアが高い（＝類似度が高い）ものが下に来るように、上位10件を取得する
  return _(results)
    .filter((s) => s.score > 0)
    .sortBy(["score"])
    .slice(-10)
    .map((s) => s.text)
    .value();
}
