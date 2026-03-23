import Bluebird from "bluebird";
import type { Tokenizer, IpadicFeatures } from "kuromoji";

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | undefined;

async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  tokenizerPromise ??= (async () => {
    const { default: kuromoji } = await import("kuromoji");
    const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath: "/dicts" }));
    return await builder.buildAsync();
  })();

  return await tokenizerPromise;
}

type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const [{ default: analyze }, tokenizer] = await Promise.all([
    import("negaposi-analyzer-ja"),
    getTokenizer(),
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
