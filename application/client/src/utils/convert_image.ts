import type { ConvertImageRequest, ConvertImageResponse } from "../workers/convert_image.worker";

interface Options {
  extension: string;
}

// ImageMagick WASM の JS パース（5MB超）と WASM 実行をメインスレッドから分離するため
// Web Worker に処理を委譲する。
export async function convertImage(file: File, options: Options): Promise<Blob> {
  const worker = new Worker(
    new URL("../workers/convert_image.worker.ts", import.meta.url),
    { type: "module" },
  );

  const buffer = await file.arrayBuffer();

  return new Promise<Blob>((resolve, reject) => {
    worker.addEventListener("message", (event: MessageEvent<ConvertImageResponse>) => {
      worker.terminate();
      if (event.data.ok) {
        resolve(new Blob([event.data.buffer], { type: "image/jpeg" }));
      } else {
        reject(new Error(event.data.message));
      }
    });

    worker.addEventListener("error", (err) => {
      worker.terminate();
      reject(err);
    });

    const request: ConvertImageRequest = { buffer, format: options.extension };
    worker.postMessage(request, [buffer]);
  });
}
