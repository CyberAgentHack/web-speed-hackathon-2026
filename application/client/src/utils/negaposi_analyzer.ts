import { WorkerManager } from "./worker_manager";

type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  return await WorkerManager.request<SentimentResult>("analyzeSentiment", text);
}
