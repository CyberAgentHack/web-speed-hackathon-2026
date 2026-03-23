import path from "path";
import Bluebird from "bluebird";
import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";

import { PUBLIC_PATH } from "@web-speed-hackathon-2026/server/src/paths";

let tokenizerCache: Tokenizer<IpadicFeatures> | null = null;

export async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (tokenizerCache) return tokenizerCache;
  const builder = Bluebird.promisifyAll(
    kuromoji.builder({ dicPath: path.join(PUBLIC_PATH, "dicts") }),
  );
  tokenizerCache = await builder.buildAsync();
  return tokenizerCache;
}
