export interface SearchFormData {
  searchText: string;
}

export interface SentimentResult {
  score: number;
  label: "positive" | "negative" | "neutral";
}
