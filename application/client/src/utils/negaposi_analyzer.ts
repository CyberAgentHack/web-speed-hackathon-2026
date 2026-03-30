import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  return await fetchJSON<SentimentResult>(`/api/v1/sentiment?q=${encodeURIComponent(text)}`);
}
