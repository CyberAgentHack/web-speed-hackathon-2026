import path from "node:path";
import { fileURLToPath } from "node:url";

import Bluebird from "bluebird";
import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dicPath = path.resolve(__dirname, "../../..", "public/dicts");

const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath }));
export const tokenizer: Tokenizer<IpadicFeatures> = await builder.buildAsync();
