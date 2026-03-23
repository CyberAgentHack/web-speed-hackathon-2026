import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

export function buildTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (tokenizerPromise != null) {
    return tokenizerPromise;
  }

  tokenizerPromise = new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: "/dicts" }).build((error, tokenizer) => {
      if (error != null) {
        tokenizerPromise = null;
        reject(error);
        return;
      }

      if (tokenizer == null) {
        tokenizerPromise = null;
        reject(new Error("Failed to initialize tokenizer."));
        return;
      }

      resolve(tokenizer);
    });
  });

  return tokenizerPromise;
}
