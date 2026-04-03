type FFmpegWorkerRequestInput =
  | {
      type: "convert-movie";
      fileBuffer: ArrayBuffer;
      extension: string;
      size?: number;
    }
  | {
      type: "extract-sound-metadata";
      fileBuffer: ArrayBuffer;
    }
  | {
      type: "convert-sound";
      fileBuffer: ArrayBuffer;
      extension: string;
      artist: string;
      title: string;
    };

type FFmpegWorkerResponse =
  | {
      id: number;
      type: "success";
      outputBuffer: ArrayBuffer;
    }
  | {
      id: number;
      type: "error";
      message: string;
    };

let workerPromise: Promise<Worker> | undefined;
let nextRequestId = 1;

async function getWorker(): Promise<Worker> {
  if (workerPromise) {
    return workerPromise;
  }

  workerPromise = Promise.resolve(
    new Worker(new URL("../workers/ffmpeg.worker.ts", import.meta.url), { type: "module" }),
  );

  return workerPromise;
}

export async function requestFFmpegWorker(
  request: FFmpegWorkerRequestInput,
  transfer: Transferable[] = [],
): Promise<ArrayBuffer> {
  const worker = await getWorker();
  const id = nextRequestId++;

  return await new Promise((resolve, reject) => {
    const handleMessage = (event: MessageEvent<FFmpegWorkerResponse>) => {
      const response = event.data;
      if (response.id !== id) {
        return;
      }

      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);

      if (response.type === "error") {
        reject(new Error(response.message));
        return;
      }

      resolve(response.outputBuffer);
    };

    const handleError = () => {
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
      reject(new Error("FFmpeg worker failed"));
    };

    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);

    worker.postMessage({ id, ...request }, transfer);
  });
}
