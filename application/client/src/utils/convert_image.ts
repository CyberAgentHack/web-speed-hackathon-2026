import type { MagickFormat } from "@imagemagick/magick-wasm";

interface Options {
  extension: MagickFormat;
}

type ConvertImageWorkerRequest = {
  id: number;
  type: "convert";
  fileBuffer: ArrayBuffer;
  extension: MagickFormat;
};

type ConvertImageWorkerResponse =
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

function getWorker(): Promise<Worker> {
  if (workerPromise) {
    return workerPromise;
  }

  workerPromise = Promise.resolve(
    new Worker(new URL("../workers/image_convert.worker.ts", import.meta.url), { type: "module" }),
  );

  return workerPromise;
}

export async function convertImage(file: File, options: Options): Promise<Blob> {
  const worker = await getWorker();
  const requestId = nextRequestId++;
  const fileBuffer = await file.arrayBuffer();

  return await new Promise((resolve, reject) => {
    const handleMessage = (event: MessageEvent<ConvertImageWorkerResponse>) => {
      const response = event.data;
      if (response.id !== requestId) {
        return;
      }

      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);

      if (response.type === "error") {
        reject(new Error(response.message));
        return;
      }

      resolve(new Blob([response.outputBuffer]));
    };

    const handleError = () => {
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
      reject(new Error("Image conversion worker failed"));
    };

    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);

    const request: ConvertImageWorkerRequest = {
      id: requestId,
      type: "convert",
      fileBuffer,
      extension: options.extension,
    };

    worker.postMessage(request, [fileBuffer]);
  });
}
