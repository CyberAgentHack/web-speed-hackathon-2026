import path from "node:path";

import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";
import analyze from "negaposi-analyzer-ja";

let cachedTokenizer: Tokenizer<IpadicFeatures> | null = null;

export function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (cachedTokenizer) {
    return Promise.resolve(cachedTokenizer);
  }
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: path.resolve("node_modules/kuromoji/dict") }).build((err, tokenizer) => {
      if (err) {
        reject(err);
        return;
      }
      cachedTokenizer = tokenizer;
      resolve(tokenizer);
    });
  });
}

type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const tokenizer = await getTokenizer();
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
