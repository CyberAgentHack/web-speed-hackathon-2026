import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

type SentimentResult = {
  score: number;
  isNegative: boolean;
};

export async function analyzeSentiment(text: string): Promise<{ label: "positive" | "negative" | "neutral" }> {
  try {
    const result = await fetchJSON<SentimentResult>(`/api/v1/sentiment?text=${encodeURIComponent(text)}`);
    const label = result.isNegative ? "negative" : result.score > 0.1 ? "positive" : "neutral";
    return { label };
  } catch {
    return { label: "neutral" };
  }
}
