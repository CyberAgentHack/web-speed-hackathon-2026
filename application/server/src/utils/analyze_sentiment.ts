import type { IpadicFeatures, Tokenizer } from "kuromoji";
import kuromoji from "kuromoji";
import analyze from "negaposi-analyzer-ja";

const tokenizerPromise = new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
  kuromoji.builder({ dicPath: "node_modules/kuromoji/dict" }).build((err, tokenizer) => {
    if (err) {
      reject(err);
    } else {
      resolve(tokenizer);
    }
  });
});

export async function analyzeSentiment(text: string): Promise<boolean> {
  if (!text.trim()) {
    return false;
  }

  const tokenizer = await tokenizerPromise;
  const tokens = tokenizer.tokenize(text);
  const score = analyze(tokens);

  return score < -0.1;
}
