import { createRequire } from "node:module";
import path from "node:path";

import kuromoji from "kuromoji";
import type { Tokenizer, IpadicFeatures } from "kuromoji";

const require = createRequire(import.meta.url);
const DICT_PATH = path.resolve(path.dirname(require.resolve("kuromoji")), "../dict");

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