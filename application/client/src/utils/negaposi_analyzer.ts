type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const res = await fetch("/api/v1/sentiment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    credentials: "same-origin",
  });

  if (!res.ok) {
    return { score: 0, label: "neutral" };
  }

  return res.json() as Promise<SentimentResult>;
}
