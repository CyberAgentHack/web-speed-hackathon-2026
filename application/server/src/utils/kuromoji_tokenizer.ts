import type { Tokenizer, IpadicFeatures } from "kuromoji";

let cachedTokenizer: Tokenizer<IpadicFeatures> | null = null;

export const getTokenizer = async (): Promise<Tokenizer<IpadicFeatures>> => {
  if (cachedTokenizer) {
    return cachedTokenizer;
  }

  const kuromojiModule = await import("kuromoji");
  const kuromoji = kuromojiModule.default ?? kuromojiModule;

  const tokenizer = await new Promise<Tokenizer<IpadicFeatures>>(
    (resolve, reject) => {
      kuromoji.builder({ dicPath: "node_modules/kuromoji/dict" }).build((err: Error | null, tokenizer: Tokenizer<IpadicFeatures>) => {
        if (err) reject(err);
        else resolve(tokenizer);
      });
    },
  );

  cachedTokenizer = tokenizer;
  return tokenizer;
};
