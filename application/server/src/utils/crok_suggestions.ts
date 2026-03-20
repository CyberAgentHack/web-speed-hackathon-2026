import { BM25 } from "bayesian-bm25";
import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";
import path from "node:path";
import { fileURLToPath } from "node:url";

const STOP_POS = new Set(["助詞", "助動詞", "記号"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dictionaryPath = path.join(__dirname, "../../../public/dicts");

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | undefined;

function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (tokenizerPromise) {
    return tokenizerPromise;
  }

  tokenizerPromise = new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: dictionaryPath }).build((error, tokenizer) => {
      if (error !== null || tokenizer === undefined) {
        tokenizerPromise = undefined;
        reject(error ?? new Error("Failed to build kuromoji tokenizer"));
        return;
      }

      resolve(tokenizer);
    });
  });

  return tokenizerPromise;
}

/**
 * 形態素解析で内容語トークン（名詞、動詞、形容詞など）を抽出
 */
export function extractTokens(tokens: IpadicFeatures[]): string[] {
  return tokens
    .filter((token) =>
      token.surface_form !== "" && token.pos !== "" && !STOP_POS.has(token.pos)
    )
    .map((token) => token.surface_form.toLowerCase());
}

/**
 * BM25で候補をスコアリングして、クエリと類似度の高い上位10件を返す
 */
export function filterSuggestionsBM25(
  tokenizer: Tokenizer<IpadicFeatures>,
  candidates: string[],
  queryTokens: string[],
): string[] {
  if (queryTokens.length === 0) {
    return [];
  }

  const bm25 = new BM25({ k1: 1.2, b: 0.75 });

  const tokenizedCandidates = candidates.map((candidate) =>
    extractTokens(tokenizer.tokenize(candidate))
  );
  bm25.index(tokenizedCandidates);

  const scores = bm25.getScores(queryTokens);
  const results = candidates.map((text, index) => ({
    score: scores[index] ?? 0,
    text,
  }));

  // スコアが高い（＝類似度が高い）ものが下に来るように、上位10件を取得する
  return results
    .filter((item) => item.score > 0)
    .sort((a, b) => a.score - b.score)
    .slice(-10)
    .map((item) => item.text);
}

export async function getCrokSuggestionsByBM25(
  candidates: string[],
  query: string,
): Promise<{ queryTokens: string[]; suggestions: string[] }> {
  const tokenizer = await getTokenizer();
  const queryTokens = extractTokens(tokenizer.tokenize(query));

  return {
    queryTokens,
    suggestions: filterSuggestionsBM25(tokenizer, candidates, queryTokens),
  };
}
