import type { IpadicFeatures, Tokenizer } from "kuromoji";

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (tokenizerPromise !== null) {
    return await tokenizerPromise;
  }

  tokenizerPromise = Promise.all([import("bluebird"), import("kuromoji")]).then(
    ([bluebirdModule, kuromojiModule]) => {
      const builder = bluebirdModule.default.promisifyAll(
        kuromojiModule.default.builder({ dicPath: "/dicts" }),
      );
      return builder.buildAsync();
    },
  );

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
  const score = analyze(tokenizer.tokenize(text));

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
