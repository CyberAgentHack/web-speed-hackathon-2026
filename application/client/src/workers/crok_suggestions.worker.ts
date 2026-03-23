/// <reference lib="webworker" />

import Bluebird from "bluebird";
import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";

import {
  extractTokens,
  filterSuggestionsBM25,
} from "@web-speed-hackathon-2026/client/src/utils/bm25_search";

export type SuggestionWorkerRequest =
  | { type: "init" }
  | { type: "suggest"; requestId: number; inputValue: string; candidates: string[] };

export type SuggestionWorkerResponse =
  | { type: "inited" }
  | { type: "suggested"; requestId: number; tokens: string[]; results: string[] }
  | { type: "error"; requestId?: number; message: string };

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

const buildTokenizer = () => {
  if (!tokenizerPromise) {
    const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath: "/dicts" })) as {
      buildAsync: () => Promise<Tokenizer<IpadicFeatures>>;
    };
    tokenizerPromise = builder.buildAsync();
  }
  return tokenizerPromise;
};

self.addEventListener("message", (event: MessageEvent<SuggestionWorkerRequest>) => {
  void (async () => {
    try {
      if (event.data.type === "init") {
        await buildTokenizer();
        self.postMessage({ type: "inited" } satisfies SuggestionWorkerResponse);
        return;
      }

      const { requestId, inputValue, candidates } = event.data;
      const tokenizer = await buildTokenizer();
      const tokens = extractTokens(tokenizer.tokenize(inputValue));
      const results = filterSuggestionsBM25(tokenizer, candidates, tokens);

      self.postMessage({ type: "suggested", requestId, tokens, results } satisfies SuggestionWorkerResponse);
    } catch (error) {
      const requestId = event.data.type === "suggest" ? event.data.requestId : undefined;
      self.postMessage({
        type: "error",
        requestId,
        message: error instanceof Error ? error.message : "Failed to process suggestions",
      } satisfies SuggestionWorkerResponse);
    }
  })();
});
