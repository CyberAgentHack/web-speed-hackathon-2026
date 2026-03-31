import type { IpadicFeatures, Tokenizer } from "kuromoji";

function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  return import("kuromoji").then(({ default: kuromoji }) => {
    return new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
      kuromoji.builder({ dicPath: "/dicts" }).build((err, tokenizer) => {
        if (err) reject(err);
        else resolve(tokenizer);
      });
    });
  });
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
