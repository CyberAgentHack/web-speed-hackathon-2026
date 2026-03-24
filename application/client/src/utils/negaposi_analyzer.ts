type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  try {
    const res = await fetch(`/api/v1/sentiment?text=${encodeURIComponent(text)}`);
    if (!res.ok) {
      return { score: 0, label: "neutral" };
    }
    return (await res.json()) as SentimentResult;
  } catch {
    return { score: 0, label: "neutral" };
  }
}
