import { fetchJSON } from "./fetchers";

const cacheMap = new Map<string, { suggestions: string[]; tokens: string[] }>();

export const fetchSuggestions = async (query: string) => {
  if (cacheMap.has(query)) {
    return cacheMap.get(query)!;
  }

  const result = await fetchJSON<{
    suggestions: string[];
    tokens: string[];
  }>(`/api/v1/crok/suggestions?q=${encodeURIComponent(query)}`);

  cacheMap.set(query, result);
  if (cacheMap.size > 100) {
    // キャッシュが100件を超えたら古いものから削除
    const firstKey = cacheMap.keys().next().value;
    if (firstKey) {
      cacheMap.delete(firstKey);
    }
  }

  return result;
};

export const fetchNegaposi = async (query: string) => {
  const result = await fetchJSON<{
    score: number;
    label: "positive" | "negative" | "neutral";
  }>(`/api/v1/negaposi?q=${encodeURIComponent(query)}`);

  return result;
};
