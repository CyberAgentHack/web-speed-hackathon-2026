import type { Tokenizer, IpadicFeatures } from "kuromoji";

const STOP_POS = new Set(["助詞", "助動詞", "記号"]);

export interface SuggestionIndexEntry {
  searchText: string;
  text: string;
  tokens: string[];
}

/**
 * 形態素解析で内容語トークン（名詞、動詞、形容詞など）を抽出
 */
export function extractTokens(tokens: IpadicFeatures[]): string[] {
  return tokens
    .filter((t) => t.surface_form !== "" && t.pos !== "" && !STOP_POS.has(t.pos))
    .map((t) => t.surface_form.toLowerCase());
}

export function buildSuggestionIndex(
  tokenizer: Tokenizer<IpadicFeatures>,
  candidates: string[],
): SuggestionIndexEntry[] {
  return candidates.map((text) => ({
    text,
    tokens: extractTokens(tokenizer.tokenize(text)),
    searchText: text.toLowerCase(),
  }));
}

export function filterSuggestions(
  candidates: SuggestionIndexEntry[],
  queryText: string,
  queryTokens: string[],
): string[] {
  if (queryTokens.length === 0) {
    return [];
  }

  const loweredQuery = queryText.trim().toLowerCase();

  return candidates
    .map((candidate) => {
      let score = candidate.searchText.includes(loweredQuery) ? 100 : 0;

      for (const token of queryTokens) {
        if (candidate.tokens.includes(token)) {
          score += 12;
          continue;
        }

        if (candidate.searchText.includes(token)) {
          score += 6;
          continue;
        }

        if (candidate.tokens.some((candidateToken) => candidateToken.startsWith(token))) {
          score += 3;
        }
      }

      return { score, text: candidate.text };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.text.localeCompare(b.text, "ja-JP"))
    .slice(0, 10)
    .map((candidate) => candidate.text);
}
