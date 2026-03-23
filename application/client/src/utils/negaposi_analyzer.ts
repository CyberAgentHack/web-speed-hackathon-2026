import type { Tokenizer, IpadicFeatures } from "kuromoji";

let _tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (_tokenizerPromise) return _tokenizerPromise;
  _tokenizerPromise = (async () => {
    const [{ default: Bluebird }, { default: kuromoji }] = await Promise.all([
      import("bluebird"),
      import("kuromoji"),
    ]);
    const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath: "/dicts" }));
    return await (builder as any).buildAsync();
  })();
  return _tokenizerPromise;
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
