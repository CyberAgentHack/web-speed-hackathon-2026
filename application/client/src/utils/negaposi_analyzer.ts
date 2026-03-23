import kuromoji, { type Tokenizer, type IpadicFeatures } from "kuromoji";
import analyze from "negaposi-analyzer-ja";

// tokenizer はモジュールレベルでキャッシュ（初回のみビルド）
const tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> = new Promise((resolve, reject) => {
  kuromoji.builder({ dicPath: "/dicts" }).build((err, tokenizer) => {
    if (err) reject(err);
    else resolve(tokenizer);
  });
});

type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const tokenizer = await tokenizerPromise;
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
