import { getTokenizer } from "@web-speed-hackathon-2026/server/src/utils/kuromoji_tokenizer";

type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export const analyzeSentiment = async (text: string): Promise<SentimentResult> => {
  const [{ default: analyze }, tokenizer] = await Promise.all([
    import("negaposi-analyzer-ja"),
    getTokenizer(),
  ]);

  const tokens = tokenizer.tokenize(text);

  const score = analyze(tokens);

  let label: SentimentResult["label"];
  if (score > 0.1) {
    label = "positive";
  } else if (score < -0.1) {
    label = "negative";
  } else {
    label = "neutral";
  }

  return { score, label };
};
