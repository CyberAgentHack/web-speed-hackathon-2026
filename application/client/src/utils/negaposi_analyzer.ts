export type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

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

type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse;

let requestId = 0;
let sentimentWorker: Worker | null = null;

function getSentimentWorker(): Worker {
  if (sentimentWorker === null) {
    sentimentWorker = new Worker(new URL("./sentiment_analysis_worker.ts", import.meta.url), {
      type: "module",
    });
  }

  return sentimentWorker;
}

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const currentRequestId = requestId++;
  const worker = getSentimentWorker();

  return await new Promise<SentimentResult>((resolve, reject) => {
    const handleMessage = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.requestId !== currentRequestId) {
        return;
      }

      worker.removeEventListener("message", handleMessage as EventListener);
      worker.removeEventListener("error", handleError);

      if ("error" in event.data) {
        reject(new Error(event.data.error));
        return;
      }

      resolve(event.data.result);
    };

    const handleError = (error: ErrorEvent) => {
      worker.removeEventListener("message", handleMessage as EventListener);
      worker.removeEventListener("error", handleError);
      reject(error.error ?? new Error(error.message));
    };

    worker.addEventListener("message", handleMessage as EventListener);
    worker.addEventListener("error", handleError);
    const request: WorkerRequest = { requestId: currentRequestId, text };
    worker.postMessage(request);
  });
}
