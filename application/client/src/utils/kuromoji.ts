import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";

export function buildTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: "/dicts" }).build((error, tokenizer) => {
      if (error != null) {
        reject(error);
        return;
      }

      if (tokenizer == null) {
        reject(new Error("Failed to initialize tokenizer."));
        return;
      }

      resolve(tokenizer);
    });
  });
}
