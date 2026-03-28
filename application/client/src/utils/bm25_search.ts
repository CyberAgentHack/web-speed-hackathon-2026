const segmenter = new Intl.Segmenter("ja", { granularity: "word" });

/**
 * Intl.Segmenter で内容語トークンを抽出
 */
export function extractTokens(text: string): string[] {
  return Array.from(segmenter.segment(text))
    .filter((s) => s.isWordLike)
    .map((s) => s.segment.toLowerCase());
}

/**
 * トークンオーバーラップで候補をスコアリングして、クエリと類似度の高い上位10件を返す
 */
export function filterSuggestions(candidates: string[], queryTokens: string[]): string[] {
  if (queryTokens.length === 0) return [];

  const querySet = new Set(queryTokens);

  const scored = candidates.map((text) => {
    const tokens = extractTokens(text);
    const score = tokens.filter((t) => querySet.has(t)).length;
    return { text, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => a.score - b.score)
    .slice(-10)
    .map((s) => s.text);
}
