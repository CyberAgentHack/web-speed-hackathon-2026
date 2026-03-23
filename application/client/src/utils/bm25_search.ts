import { BM25 } from "bayesian-bm25";
import type { Tokenizer, IpadicFeatures } from "kuromoji";
import _ from "lodash";

const STOP_POS = new Set(["助詞", "助動詞", "記号"]);

/**
 * 形態素解析で内容語トークン（名詞、動詞、形容詞など）を抽出
 */
export function extractTokens(tokens: IpadicFeatures[]): string[] {
  return tokens
    .filter((t) => t.surface_form !== "" && t.pos !== "" && !STOP_POS.has(t.pos))
    .map((t) => t.surface_form.toLowerCase());
}

/**
 * BM25で候補をスコアリングして、クエリと類似度の高い上位10件を返す
 * コンストラクターで1度だけインデックスを構築し、検索時の計算量を O(1) に抑えます。
 */
export class BM25Suggester {
  private bm25: BM25;
  private candidates: string[];

  constructor(tokenizer: Tokenizer<IpadicFeatures>, candidates: string[]) {
    this.bm25 = new BM25({ k1: 1.2, b: 0.75 });
    this.candidates = candidates;
    const tokenizedCandidates = candidates.map((c) => extractTokens(tokenizer.tokenize(c)));
    this.bm25.index(tokenizedCandidates);
  }

  getSuggestions(queryTokens: string[]): string[] {
    if (queryTokens.length === 0) return [];

    const results = _.zipWith(this.candidates, this.bm25.getScores(queryTokens), (text, score) => {
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
}
