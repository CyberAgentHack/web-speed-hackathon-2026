import analyze from "negaposi-analyzer-ja";

const segmenter = new Intl.Segmenter("ja", { granularity: "word" });

type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export function analyzeSentiment(text: string): SentimentResult {
  const tokens = Array.from(segmenter.segment(text))
    .filter((s) => s.isWordLike)
    .map((s) => ({ surface_form: s.segment }));

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
