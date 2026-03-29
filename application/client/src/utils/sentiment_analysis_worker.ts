import Bluebird from "bluebird";
import kuromoji, { type Tokenizer, type IpadicFeatures } from "kuromoji";
import analyze from "negaposi-analyzer-ja";

import type { SentimentResult } from "./negaposi_analyzer";

type WorkerRequest = {
  requestId: number;
  text: string;
};

type WorkerSuccessResponse = {
  requestId: number;
  result: SentimentResult;
};

type WorkerErrorResponse = {
  requestId: number;
  error: string;
};

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (tokenizerPromise === null) {
    const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath: "/dicts" }));
    tokenizerPromise = builder.buildAsync().catch((error) => {
      tokenizerPromise = null;
      throw error;
    });
  }

  return await tokenizerPromise;
}

function createSentimentResult(score: number): SentimentResult {
  if (score > 0.1) {
    return { score, label: "positive" };
  }

  if (score < -0.1) {
    return { score, label: "negative" };
  }

  return { score, label: "neutral" };
}

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  void getTokenizer()
    .then((tokenizer) => {
      const tokens = tokenizer.tokenize(event.data.text);
      const score = analyze(tokens);
      const response: WorkerSuccessResponse = {
        requestId: event.data.requestId,
        result: createSentimentResult(score),
      };

      self.postMessage(response);
    })
    .catch((error: unknown) => {
      const response: WorkerErrorResponse = {
        requestId: event.data.requestId,
        error: error instanceof Error ? error.message : "Sentiment analysis failed",
      };

      self.postMessage(response);
    });
});
