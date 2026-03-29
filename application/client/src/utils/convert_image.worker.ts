import { initializeImageMagick, ImageMagick } from "@imagemagick/magick-wasm";
import type { MagickFormat } from "@imagemagick/magick-wasm";
import magickWasm from "@imagemagick/magick-wasm/magick.wasm?binary";
import { dump, insert, ImageIFD } from "piexifjs";

const MAX_IMAGE_DIMENSION = 1600;

interface ConvertMessage {
  byteArray: Uint8Array;
  format: MagickFormat;
}

interface ConvertResult {
  alt: string;
  buffer: ArrayBuffer;
}

interface WorkerRuntime {
  onmessage: ((event: MessageEvent<ConvertMessage>) => void) | null;
  postMessage: (message: ConvertResult, transfer?: Transferable[]) => void;
}

const workerScope = self as unknown as WorkerRuntime;

/** Uint8Array を binary string へ変換（チャンク処理で高速化） */
function uint8ArrayToBinaryString(arr: Uint8Array): string {
  const CHUNK = 0x8000;
  let result = "";
  for (let i = 0; i < arr.length; i += CHUNK) {
    result += String.fromCharCode.apply(null, arr.subarray(i, i + CHUNK) as unknown as number[]);
  }
  return result;
}

workerScope.onmessage = async (event: MessageEvent<ConvertMessage>) => {
  const { byteArray, format } = event.data;

  await initializeImageMagick(magickWasm);

  const result = await new Promise<ConvertResult>((resolve) => {
    ImageMagick.read(byteArray, (img) => {
      const comment = img.comment ?? "";

      const longestEdge = Math.max(img.width, img.height);
      if (longestEdge > MAX_IMAGE_DIMENSION) {
        const scale = MAX_IMAGE_DIMENSION / longestEdge;
        img.resize(Math.round(img.width * scale), Math.round(img.height * scale));
      }

      img.format = format;

      img.write((output) => {
        const outArray = output as Uint8Array<ArrayBuffer>;

        if (comment === "") {
          // buffer を transfer してコピーコストを省く
          const buf = outArray.buffer.slice(
            outArray.byteOffset,
            outArray.byteOffset + outArray.byteLength,
          );
          resolve({ alt: "", buffer: buf });
          return;
        }

        // EXIF の ImageDescription フィールドに description を書き込む
        const binary = uint8ArrayToBinaryString(outArray);
        const descriptionBinary = uint8ArrayToBinaryString(new TextEncoder().encode(comment));
        const exifStr = dump({ "0th": { [ImageIFD.ImageDescription]: descriptionBinary } });
        const outputWithExif = insert(exifStr, binary);

        // binary string → Uint8Array（ループで charCodeAt を使用）
        const bytes = new Uint8Array(outputWithExif.length);
        for (let i = 0; i < outputWithExif.length; i++) {
          bytes[i] = outputWithExif.charCodeAt(i);
        }
        resolve({ alt: comment, buffer: bytes.buffer });
      });
    });
  });

  workerScope.postMessage(result, [result.buffer]);
};
