import path from "node:path";

import { BM25 } from "bayesian-bm25";
import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";

import { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models";
import { PUBLIC_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const STOP_POS = new Set(["助詞", "助動詞", "記号"]);
const MAX_SUGGESTIONS = 10;
const MIN_QUERY_LENGTH = 2;

type IndexedSuggestions = {
  bm25: BM25;
  questions: string[];
  tokenizer: Tokenizer<IpadicFeatures>;
};

let indexedSuggestionsPromise: Promise<IndexedSuggestions> | null = null;

function extractTokens(tokens: IpadicFeatures[]): string[] {
  return tokens
    .filter((token) => token.surface_form !== "" && token.pos !== "" && !STOP_POS.has(token.pos))
    .map((token) => token.surface_form.toLowerCase());
}

async function getTokenizer() {
  return await new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
    kuromoji
      .builder({ dicPath: path.resolve(PUBLIC_PATH, "dicts") })
      .build((error, tokenizer) => {
        if (error != null || tokenizer == null) {
          reject(error ?? new Error("Tokenizer build failed"));
          return;
        }
        resolve(tokenizer);
      });
  });
}

async function getIndexedSuggestions() {
  if (indexedSuggestionsPromise != null) {
    return await indexedSuggestionsPromise;
  }

  indexedSuggestionsPromise = (async () => {
    const [tokenizer, suggestions] = await Promise.all([
      getTokenizer(),
      QaSuggestion.findAll({
        attributes: ["question"],
        logging: false,
        order: [["id", "ASC"]],
      }),
    ]);

    const questions = suggestions.map((suggestion) => suggestion.question);
    const tokenizedQuestions = questions.map((question) => extractTokens(tokenizer.tokenize(question)));
    const bm25 = new BM25({ b: 0.75, k1: 1.2 });
    bm25.index(tokenizedQuestions);

    return {
      bm25,
      questions,
      tokenizer,
    };
  })();

  try {
    return await indexedSuggestionsPromise;
  } catch (error) {
    indexedSuggestionsPromise = null;
    throw error;
  }
}

export async function searchCrokSuggestions(query: string) {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < MIN_QUERY_LENGTH) {
    return {
      queryTokens: [],
      suggestions: [],
    };
  }

  const { bm25, questions, tokenizer } = await getIndexedSuggestions();
  const queryTokens = extractTokens(tokenizer.tokenize(normalizedQuery));
  if (queryTokens.length === 0) {
    return {
      queryTokens,
      suggestions: [],
    };
  }

  const scores = bm25.getScores(queryTokens);
  const suggestions = questions
    .map((text, index) => ({
      score: scores[index] ?? 0,
      text,
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_SUGGESTIONS)
    .map((candidate) => candidate.text);

  return {
    queryTokens,
    suggestions,
  };
}
