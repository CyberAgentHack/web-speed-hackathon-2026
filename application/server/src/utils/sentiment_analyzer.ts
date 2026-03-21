import analyze from "negaposi-analyzer-ja";

import { tokenizer } from "@web-speed-hackathon-2026/server/src/utils/tokenizer";

type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export function analyzeSentiment(text: string): SentimentResult {
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
}
