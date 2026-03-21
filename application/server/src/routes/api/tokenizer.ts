import path from "path";

import kuromoji from "kuromoji";
import type { Tokenizer, IpadicFeatures } from "kuromoji";

const DICT_PATH = path.resolve(
  import.meta.dirname,
  "../../../node_modules/kuromoji/dict",
);

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

export function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: DICT_PATH }).build((err, tokenizer) => {
        if (err) reject(err);
        else resolve(tokenizer);
      });
    });
  }
  return tokenizerPromise;
}
