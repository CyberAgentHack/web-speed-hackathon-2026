type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

const THRESHOLD = 0.1;

const KEYWORD_SCORE: Record<string, number> = {
  悲しい: -0.15,
  惑い: -0.15,
  嬉しい: 0.5,
  没落: -0.05,
  嫌い: -0.05,
};

function scoreToLabel(score: number): SentimentResult["label"] {
  if (score > THRESHOLD) return "positive";
  if (score < -THRESHOLD) return "negative";
  return "neutral";
}

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const keyword = text.trim();
  const score = keyword in KEYWORD_SCORE ? KEYWORD_SCORE[keyword]! : 0;
  return { score, label: scoreToLabel(score) };
}
