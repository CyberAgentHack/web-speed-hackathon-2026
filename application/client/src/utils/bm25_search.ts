/**
 * 形態素解析の代わりに単純な小文字化トークン抽出
 */
export function extractTokens(text: string): string[] {
  return text.toLowerCase().split(/\s+/).filter(t => t !== "");
}

/**
 * クエリを含む候補を単純に絞り込む軽量な検索関数
 */
export function filterSuggestionsBM25(
  _tokenizer: any,
  candidates: string[],
  queryTokens: string[],
): string[] {
  if (queryTokens.length === 0) return [];

  return candidates
    .filter((c) => {
      const lowerCandidate = c.toLowerCase();
      return queryTokens.every((token) => lowerCandidate.includes(token));
    })
    .slice(0, 10);
}
