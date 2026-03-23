import path from "node:path";

import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";
import analyze from "negaposi-analyzer-ja";

import { PUBLIC_PATH } from "@web-speed-hackathon-2026/server/src/paths";

export type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

const DICTIONARY_PATH = path.join(PUBLIC_PATH, "dicts");

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (tokenizerPromise === null) {
    tokenizerPromise = new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
      kuromoji.builder({ dicPath: DICTIONARY_PATH }).build((error, tokenizer) => {
        if (error != null || tokenizer == null) {
          tokenizerPromise = null;
          reject(error ?? new Error("Failed to build tokenizer."));
          return;
        }

        resolve(tokenizer);
      });
    });
  }

  return tokenizerPromise;
}

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(text);
  const score = analyze(tokens);

  if (score > 0.1) {
    return { score, label: "positive" };
  }
  if (score < -0.1) {
    return { score, label: "negative" };
  }

  return { score, label: "neutral" };
}
