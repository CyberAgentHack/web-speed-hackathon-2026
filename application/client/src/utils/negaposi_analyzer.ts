import type { Tokenizer, IpadicFeatures } from "kuromoji";

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;
let analyzePromise: Promise<(tokens: IpadicFeatures[]) => number> | null = null;

async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (tokenizerPromise == null) {
    tokenizerPromise = (async () => {
      const [{ default: Bluebird }, kuromoji] = await Promise.all([
        import("bluebird"),
        import("kuromoji"),
      ]);
      const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath: "/dicts" }));
      return await builder.buildAsync();
    })();
  }

  return await tokenizerPromise;
}

async function getAnalyzer(): Promise<(tokens: IpadicFeatures[]) => number> {
  if (analyzePromise == null) {
    analyzePromise = import("negaposi-analyzer-ja").then(({ default: analyze }) => analyze);
  }

  return await analyzePromise;
}

type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const [tokenizer, analyze] = await Promise.all([getTokenizer(), getAnalyzer()]);
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
