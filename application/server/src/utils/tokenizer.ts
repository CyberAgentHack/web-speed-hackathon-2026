import Bluebird from "bluebird";
import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

let cachedTokenizer: Tokenizer<IpadicFeatures> | null = null;

export async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (cachedTokenizer) return cachedTokenizer;

  const dicPath = path.resolve(path.dirname(require.resolve("kuromoji/package.json")), "dict");
  const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath }));
  cachedTokenizer = await builder.buildAsync();
  return cachedTokenizer;
}
