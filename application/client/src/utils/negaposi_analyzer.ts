import type { Tokenizer, IpadicFeatures } from "kuromoji";

async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  const kuromojiModule = await import("kuromoji");
  const kuromojiLib = kuromojiModule.default || kuromojiModule;
  const builder = kuromojiLib.builder({ dicPath: "/dicts" });
  return new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
    builder.build((err, tokenizer) => {
      if (err) reject(err);
      else resolve(tokenizer);
    });
  });
}

type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(text);

  const analyze = (await import("negaposi-analyzer-ja")).default;
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
