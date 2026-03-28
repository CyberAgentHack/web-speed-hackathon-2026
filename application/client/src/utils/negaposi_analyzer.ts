import { sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  try {
    return await sendJSON<SentimentResult>("/api/v1/sentiment", { text });
  } catch {
    return { score: 0, label: "neutral" };
  }
}
