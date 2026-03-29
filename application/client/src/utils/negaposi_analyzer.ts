/**
 * テキストの感情分析ユーティリティ。
 * kuromojiはシングルトンで共有し、negaposi-analyzer-jaは使用時のみ動的ロードする。
 */
import { getKuromojiTokenizer } from "@web-speed-hackathon-2026/client/src/utils/kuromoji_tokenizer";

type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

/** テキストの感情分析を行い、スコアとラベルを返す */
export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const [tokenizer, { default: analyze }] = await Promise.all([
    getKuromojiTokenizer(),
    import("negaposi-analyzer-ja"),
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
}
