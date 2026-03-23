import { createRequire } from "node:module";
import path from "node:path";

import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";

const require = createRequire(import.meta.url);
const kuromojiDir = path.dirname(require.resolve("kuromoji/package.json"));
const dicPath = path.join(kuromojiDir, "dict");

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | undefined;

const STOP_POS = new Set(["助詞", "助動詞", "記号"]);

export async function getKuromojiTokenizer(): Promise<
    Tokenizer<IpadicFeatures>
> {
    if (!tokenizerPromise) {
        tokenizerPromise = new Promise((resolve, reject) => {
            kuromoji.builder({ dicPath }).build((err, tokenizer) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!tokenizer) {
                    reject(new Error("Failed to build kuromoji tokenizer"));
                    return;
                }
                resolve(tokenizer);
            });
        });
    }

    return await tokenizerPromise;
}

export function extractContentTokens(tokens: IpadicFeatures[]): string[] {
    return tokens
        .filter(
            (token) =>
                token.surface_form !== "" &&
                token.pos !== "" &&
                !STOP_POS.has(token.pos),
        )
        .map((token) => token.surface_form.toLowerCase());
}
