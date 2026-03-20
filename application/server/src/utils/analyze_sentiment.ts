import path from "path";

import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";
import analyze from "negaposi-analyzer-ja";

import { PUBLIC_PATH } from "@web-speed-hackathon-2026/server/src/paths";

export type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (tokenizerPromise == null) {
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: path.join(PUBLIC_PATH, "dicts") }).build((err, tokenizer) => {
        if (err != null || tokenizer == null) {
          reject(err ?? new Error("failed to initialize kuromoji tokenizer"));
          return;
        }
        resolve(tokenizer);
      });
    });
  }

  return await tokenizerPromise;
}

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
