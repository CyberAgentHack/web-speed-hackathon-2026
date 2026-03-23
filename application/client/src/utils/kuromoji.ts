import Bluebird from "bluebird";
import kuromoji, { type Tokenizer, type IpadicFeatures } from "kuromoji";

let cachedTokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

/**
 * 20MBの辞書ファイルをロードしてパースする重い処理を、アプリ全体で1度だけ実行するためのグローバルキャッシュ
 */
export function getKuromojiTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (cachedTokenizerPromise === null) {
    const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath: "/dicts" }));
    cachedTokenizerPromise = builder.buildAsync();
  }
  return cachedTokenizerPromise;
}
