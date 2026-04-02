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

type PendingRequest = {
  reject: (reason?: unknown) => void;
  resolve: (value: SentimentResult) => void;
};

let requestId = 0;
const pendingRequests = new Map<number, PendingRequest>();
let workerInstance: Worker | null = null;

function terminateWorker() {
  workerInstance?.terminate();
  workerInstance = null;
}

function rejectAllPending(reason: unknown) {
  for (const request of pendingRequests.values()) {
    request.reject(reason);
  }
  pendingRequests.clear();
}

function ensureWorker(): Worker {
  if (workerInstance !== null) {
    return workerInstance;
  }

  const worker = new Worker(
    new URL("../workers/sentiment.worker.ts", import.meta.url),
    { type: "module" },
  );

  worker.onmessage = (event: MessageEvent<ResponseMessage>) => {
    const payload = event.data;
    const pending = pendingRequests.get(payload.id);
    if (pending == null) {
      return;
    }
    pendingRequests.delete(payload.id);

    if (payload.ok) {
      pending.resolve(payload.result);
    } else {
      pending.reject(new Error(payload.error));
    }
  };

  worker.onerror = (event) => {
    rejectAllPending(event.error ?? new Error("sentiment worker crashed"));
    terminateWorker();
  };

  workerInstance = worker;
  return worker;
}

async function analyzeSentimentInMainThread(text: string): Promise<SentimentResult> {
  const { analyzeSentiment } = await import("@web-speed-hackathon-2026/client/src/utils/negaposi_analyzer");
  return analyzeSentiment(text);
}

export async function analyzeSentimentOffThread(text: string): Promise<SentimentResult> {
  if (typeof Worker === "undefined") {
    return analyzeSentimentInMainThread(text);
  }

  try {
    const worker = ensureWorker();

    return await new Promise<SentimentResult>((resolve, reject) => {
      const id = requestId++;
      pendingRequests.set(id, { resolve, reject });
      const payload: RequestMessage = { id, text };
      worker.postMessage(payload);
    });
  } catch {
    return analyzeSentimentInMainThread(text);
  }
}
