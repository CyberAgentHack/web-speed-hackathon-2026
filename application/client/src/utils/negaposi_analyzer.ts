import type { Tokenizer, IpadicFeatures } from "kuromoji";

async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  const [Bluebird, kuromoji] = await Promise.all([
    import("bluebird").then(m => m.default),
    import("kuromoji").then(m => m.default),
  ]);
  const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath: "/dicts" }));
  return await builder.buildAsync();
}

type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const [tokenizer, { default: analyze }] = await Promise.all([
    getTokenizer(),
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
