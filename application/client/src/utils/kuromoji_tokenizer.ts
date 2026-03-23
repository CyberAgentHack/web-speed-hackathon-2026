import type { IpadicFeatures, Tokenizer } from "kuromoji";

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

export function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (!tokenizerPromise) {
    tokenizerPromise = (async () => {
      const mod = await import("kuromoji");
      const kuromoji = mod.default ?? mod;
      return new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
        kuromoji.builder({ dicPath: "/dicts" }).build((err, tokenizer) => {
          if (err) reject(err);
          else resolve(tokenizer);
        });
      });
    })().catch((err) => {
      tokenizerPromise = null;
      throw err;
    });
  }
  return tokenizerPromise;
}

/** バックグラウンドで事前初期化（エラーは握りつぶす） */
export function prefetchTokenizer(): void {
  getTokenizer().catch(() => {});
}
