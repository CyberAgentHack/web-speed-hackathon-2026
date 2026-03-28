import path from "path";

import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";
import analyze from "negaposi-analyzer-ja";

import { PUBLIC_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const DIC_PATH = path.join(PUBLIC_PATH, "dicts");

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: DIC_PATH }).build((err, tokenizer) => {
        if (err) reject(err);
        else resolve(tokenizer);
      });
    });
  }
  return tokenizerPromise;
}

export async function analyzeSentiment(text: string): Promise<{ score: number; isNegative: boolean }> {
  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(text);
  const score = analyze(tokens);
  return { score, isNegative: score < -0.1 };
}
