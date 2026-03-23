import path from "node:path";
import { fileURLToPath } from "node:url";
import kuromoji, { type Tokenizer, type IpadicFeatures } from "kuromoji";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

export const getTokenizer = (): Promise<Tokenizer<IpadicFeatures>> => {
  if (tokenizerPromise) return tokenizerPromise;
  tokenizerPromise = new Promise((resolve, reject) => {
    // Point to the server's node_modules kuromoji dict
    const dicPath = path.resolve(__dirname, "../../node_modules/kuromoji/dict");
    kuromoji.builder({ dicPath }).build((err, tokenizer) => {
      if (err) reject(err);
      else resolve(tokenizer);
    });
  });
  return tokenizerPromise;
};

const STOP_POS = new Set(["助詞", "助動詞", "記号"]);
export function extractTokens(tokens: IpadicFeatures[]): string[] {
  return tokens
    .filter((t) => t.surface_form !== "" && t.pos !== "" && !STOP_POS.has(t.pos))
    .map((t) => t.surface_form.toLowerCase());
}
