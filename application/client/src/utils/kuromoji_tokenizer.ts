/**
 * kuromojiトークナイザーのシングルトン管理。
 * 辞書(17MB)の重複ロードを防ぎ、初回ビルド後はキャッシュを返す。
 */
import type { IpadicFeatures, Tokenizer } from "kuromoji";

/** ビルド済みトークナイザーのキャッシュ */
let cachedTokenizer: Tokenizer<IpadicFeatures> | null = null;
/** ビルド中のPromise（重複ビルド防止） */
let buildingPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

/**
 * kuromojiトークナイザーを取得する。
 * 初回はビルドして返し、2回目以降はキャッシュを返す。
 */
export async function getKuromojiTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (cachedTokenizer) {
    return cachedTokenizer;
  }

  if (buildingPromise) {
    return buildingPromise;
  }

  buildingPromise = new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
    import("kuromoji").then((kuromoji) => {
      kuromoji.builder({ dicPath: "/dicts" }).build((err: Error | null, tokenizer: Tokenizer<IpadicFeatures>) => {
        if (err) {
          buildingPromise = null;
          reject(err);
        } else {
          cachedTokenizer = tokenizer;
          buildingPromise = null;
          resolve(tokenizer);
        }
      });
    }).catch((err) => {
      buildingPromise = null;
      reject(err);
    });
  });

  return buildingPromise;
}
