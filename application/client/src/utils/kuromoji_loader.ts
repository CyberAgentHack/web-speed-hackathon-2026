import type { IpadicFeatures, Tokenizer } from "kuromoji";

let kuromojiPromise: Promise<typeof import("kuromoji")> | null = null;

async function loadKuromojiModule(): Promise<typeof import("kuromoji")> {
  kuromojiPromise ??= import("kuromoji");
  return kuromojiPromise;
}

export async function buildKuromojiTokenizer(
  dicPath: string = "/dicts",
): Promise<Tokenizer<IpadicFeatures>> {
  const kuromoji = await loadKuromojiModule();
  return await new Promise((resolve, reject) => {
    kuromoji
      .builder({ dicPath })
      .build((err: Error | null, tokenizer: Tokenizer<IpadicFeatures> | undefined) => {
      if (err != null || tokenizer == null) {
        reject(err ?? new Error("failed to build tokenizer"));
        return;
      }
      resolve(tokenizer);
      });
  });
}
