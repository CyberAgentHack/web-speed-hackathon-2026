import Bluebird from "bluebird";
import kuromoji, { type Tokenizer, type IpadicFeatures } from "kuromoji";

async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath: "/dicts" }));
  return await builder.buildAsync();
}

type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const { default: analyze } = await import("negaposi-analyzer-ja");
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
