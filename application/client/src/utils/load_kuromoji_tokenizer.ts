import type { IpadicFeatures, Tokenizer } from "kuromoji";

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

export async function loadKuromojiTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  tokenizerPromise ??= (async () => {
    const kuromojiModule = await import("kuromoji");
    const builder = kuromojiModule.default.builder({ dicPath: "/dicts" });
    return new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
      builder.build((err: Error | null, tokenizer: Tokenizer<IpadicFeatures>) => {
        if (err) reject(err);
        else resolve(tokenizer);
      });
    });
  })();

  return tokenizerPromise;
}
