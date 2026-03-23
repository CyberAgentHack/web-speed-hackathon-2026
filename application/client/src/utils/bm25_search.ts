import Bluebird from "bluebird";
import _ from "lodash";

const STOP_POS = new Set(["助詞", "助動詞", "記号"]);

/**
 * 形態素解析で内容語トークン（名詞、動詞、形容詞など）を抽出
 */
export function extractTokens(tokens: any[]): string[] {
  return tokens
    .filter((t) => t.surface_form !== "" && t.pos !== "" && !STOP_POS.has(t.pos))
    .map((t) => t.surface_form.toLowerCase());
}

/**
 * BM25で候補をスコアリングして、クエリと類似度の高い上位10件を返す
 */
export async function filterSuggestionsBM25(
  tokenizer: any,
  candidates: string[],
  queryTokens: string[],
): Promise<string[]> {
  if (queryTokens.length === 0) return [];

  // Dynamic import to avoid bundling bayesian-bm25 into the main bundle
  const { BM25 } = await import("bayesian-bm25");
  const bm25 = new BM25({ k1: 1.2, b: 0.75 });

  const tokenizedCandidates = candidates.map((c) => extractTokens(tokenizer.tokenize(c)));
  bm25.index(tokenizedCandidates);

  const results = _.zipWith(candidates, bm25.getScores(queryTokens), (text, score) => {
    return { text, score };
  });

  // スコアが高い（＝類似度が高い）ものが下に来るように、上位10件を取得する
  return _(results)
    .filter((s) => s.score > 0)
    .sortBy(["score"])
    .slice(-10)
    .map((s) => s.text)
    .value();
}

export async function searchBM25(
  corpus: string[],
  query: string,
  options: { k1: number; b: number } = { k1: 1.2, b: 0.75 },
): Promise<number[]> {
  // Dynamic import to avoid bundling kuromoji and bayesian-bm25 into the main bundle
  const { default: kuromoji } = await import("kuromoji");
  const { BM25 } = await import("bayesian-bm25");

  const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath: "/dicts" }));

  const tokenizer = await (builder as any).buildAsync();

  const documents = corpus.map((text) =>
    tokenizer.tokenize(text).map((token: any) => token.surface_form),
  );
  const queryTokens = tokenizer.tokenize(query).map((token: any) => token.surface_form);

  const bm25 = new BM25(documents, {
    k1: options.k1,
    b: options.b,
  });

  return bm25.search(queryTokens);
}
