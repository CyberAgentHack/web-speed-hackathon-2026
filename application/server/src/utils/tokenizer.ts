import path from "node:path";

import Bluebird from "bluebird";
import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";

import { PUBLIC_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const dicPath = path.resolve(PUBLIC_PATH, "dicts");

const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath }));
const tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> = builder.buildAsync();

export async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  return tokenizerPromise;
}
