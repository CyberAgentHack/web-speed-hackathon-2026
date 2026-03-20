import { fetchJSON } from "./fetchers";

const suggestionsCacheMap = new Map<
  string,
  { suggestions: string[]; tokens: string[] }
>();

export const fetchSuggestions = async (query: string) => {
  if (suggestionsCacheMap.has(query)) {
    return suggestionsCacheMap.get(query)!;
  }

  const result = await fetchJSON<{
    suggestions: string[];
    tokens: string[];
  }>(`/api/v1/crok/suggestions?q=${encodeURIComponent(query)}`);

  suggestionsCacheMap.set(query, result);
  if (suggestionsCacheMap.size > 100) {
    // キャッシュが100件を超えたら古いものから削除
    const firstKey = suggestionsCacheMap.keys().next().value;
    if (firstKey) {
      suggestionsCacheMap.delete(firstKey);
    }
  }

  return result;
};

const negaposiCacheMap = new Map<
  string,
  { label: "positive" | "negative" | "neutral" }
>();
export const fetchNegaposi = async (query: string) => {
  if (negaposiCacheMap.has(query)) {
    return negaposiCacheMap.get(query)!;
  }

  const result = await fetchJSON<{
    label: "positive" | "negative" | "neutral";
  }>(`/api/v1/negaposi?q=${encodeURIComponent(query)}`);

  negaposiCacheMap.set(query, result);
  if (negaposiCacheMap.size > 100) {
    // キャッシュが100件を超えたら古いものから削除
    const firstKey = negaposiCacheMap.keys().next().value;
    if (firstKey) {
      negaposiCacheMap.delete(firstKey);
    }
  }

  return result;
};
