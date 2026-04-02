import { analyzeSentiment } from "@web-speed-hackathon-2026/client/src/utils/negaposi_analyzer";

type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

type RequestMessage = {
  id: number;
  text: string;
};

type ResponseMessage =
  | {
      id: number;
      ok: true;
      result: SentimentResult;
    }
  | {
      id: number;
      ok: false;
      error: string;
    };

self.onmessage = (event: MessageEvent<RequestMessage>) => {
  const { id, text } = event.data;

  void analyzeSentiment(text)
    .then((result) => {
      const payload: ResponseMessage = { id, ok: true, result };
      self.postMessage(payload);
    })
    .catch((error: unknown) => {
      const payload: ResponseMessage = {
        id,
        ok: false,
        error: error instanceof Error ? error.message : "sentiment analysis failed",
      };
      self.postMessage(payload);
    });
};
