import path from "path";

import Bluebird from "bluebird";
import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";
import analyze from "negaposi-analyzer-ja";

import { PUBLIC_PATH } from "@web-speed-hackathon-2026/server/src/paths";

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (tokenizerPromise == null) {
    const builder = Bluebird.promisifyAll(
      kuromoji.builder({ dicPath: path.resolve(PUBLIC_PATH, "dicts") }),
    );
    tokenizerPromise = builder.buildAsync();
  }

  return await tokenizerPromise;
}

export type SearchSentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export async function analyzeSearchSentiment(text: string): Promise<SearchSentimentResult> {
  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(text);
  const score = analyze(tokens);

  let label: SearchSentimentResult["label"];
  if (score > 0.1) {
    label = "positive";
  } else if (score < -0.1) {
    label = "negative";
  } else {
    label = "neutral";
  }

  return { score, label };
}
