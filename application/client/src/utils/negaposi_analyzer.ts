import Bluebird from "bluebird";
import { type Tokenizer, type IpadicFeatures } from "kuromoji";

let tokenizerCache: Tokenizer<IpadicFeatures> | null = null;

async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (tokenizerCache) {
    return tokenizerCache;
  }
  const { default: kuromoji } = await import("kuromoji");
  const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath: "/dicts" }));
  tokenizerCache = await builder.buildAsync();
  return tokenizerCache;
}

type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(text);

  const { default: analyze } = await import("negaposi-analyzer-ja");

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
