type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const res = await fetch(`/api/v1/sentiment?text=${encodeURIComponent(text)}`);
  return await res.json();
}
