import type { MagickFormat } from "@imagemagick/magick-wasm";

interface Options {
  extension: MagickFormat;
}

interface ConvertedImage {
  alt: string;
  blob: Blob;
}

export async function convertImage(file: File, options: Options): Promise<ConvertedImage> {
  const byteArray = new Uint8Array(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    // ImageMagick の重い WASM 処理を Web Worker で実行しメインスレッドをブロックしない
    const worker = new Worker(new URL("./convert_image.worker.ts", import.meta.url));

    worker.onmessage = (event: MessageEvent<{ alt: string; buffer: ArrayBuffer }>) => {
      worker.terminate();
      resolve({ alt: event.data.alt, blob: new Blob([event.data.buffer]) });
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(err);
    };

    worker.postMessage({ byteArray, format: options.extension }, [byteArray.buffer]);
  });
}
