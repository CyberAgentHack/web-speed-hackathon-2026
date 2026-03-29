import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";

import {
  extractTokens,
  filterSuggestionsBM25,
} from "@web-speed-hackathon-2026/client/src/utils/bm25_search";

interface SuggestionSearchRequest {
  candidates: string[];
  inputValue: string;
  requestId: number;
}

interface SuggestionSearchResult {
  queryTokens: string[];
  requestId: number;
  suggestions: string[];
}

interface WorkerRuntime {
  onmessage: ((event: MessageEvent<SuggestionSearchRequest>) => void) | null;
  postMessage: (message: SuggestionSearchResult) => void;
}

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;
const workerScope = self as unknown as WorkerRuntime;

function getTokenizer() {
  if (tokenizerPromise != null) {
    return tokenizerPromise;
  }

  tokenizerPromise = new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
    kuromoji.builder({ dicPath: "/dicts" }).build((error, tokenizer) => {
      if (error != null || tokenizer == null) {
        reject(error ?? new Error("Failed to initialize kuromoji tokenizer"));
        return;
      }

      resolve(tokenizer);
    });
  });

  return tokenizerPromise;
}

workerScope.onmessage = async (event: MessageEvent<SuggestionSearchRequest>) => {
  const { candidates, inputValue, requestId } = event.data;

  if (!inputValue.trim()) {
    const emptyResult: SuggestionSearchResult = {
      queryTokens: [],
      requestId,
      suggestions: [],
    };
    workerScope.postMessage(emptyResult);
    return;
  }

  try {
    const tokenizer = await getTokenizer();
    const queryTokens = extractTokens(tokenizer.tokenize(inputValue));
    const suggestions = filterSuggestionsBM25(tokenizer, candidates, queryTokens);

    const result: SuggestionSearchResult = {
      queryTokens,
      requestId,
      suggestions,
    };
    workerScope.postMessage(result);
  } catch (error) {
    console.error(error);

    const emptyResult: SuggestionSearchResult = {
      queryTokens: [],
      requestId,
      suggestions: [],
    };
    workerScope.postMessage(emptyResult);
  }
};
