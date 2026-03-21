import type { Tokenizer, IpadicFeatures } from "kuromoji";

function buildTokenizer(dicPath: string): Promise<Tokenizer<IpadicFeatures>> {
  return import("kuromoji").then(
    ({ default: kuromoji }) =>
      new Promise((resolve, reject) => {
        kuromoji.builder({ dicPath }).build((err, tokenizer) => {
          if (err) reject(err);
          else resolve(tokenizer);
        });
      }),
  );
}

async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  return await buildTokenizer("/dicts");
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
