/// <reference lib="webworker" />

import { ImageMagick, MagickFormat, initializeImageMagick } from "@imagemagick/magick-wasm";
import { ImageIFD, dump, insert } from "piexifjs";

export type ConvertImageRequest = {
  buffer: ArrayBuffer;
  format: string;
};

export type ConvertImageResponse = { ok: true; buffer: ArrayBuffer } | { ok: false; message: string };

// WASM 初期化は一度だけ実行する（Worker は使い捨てではなくキャッシュされるため）
let initPromise: Promise<void> | null = null;

function ensureInitialized(): Promise<void> {
  if (initPromise === null) {
    initPromise = initializeImageMagick(new URL("/scripts/magick.wasm", self.location.href));
  }
  return initPromise;
}

self.addEventListener("message", (event: MessageEvent<ConvertImageRequest>) => {
  void (async () => {
    try {
      await ensureInitialized();

      const { buffer, format } = event.data;
      const byteArray = new Uint8Array(buffer);

      const result = await new Promise<{ outputBuffer: ArrayBuffer; comment?: string }>(
        (resolve) => {
          ImageMagick.read(byteArray, (img) => {
            img.format = format as MagickFormat;
            const comment = img.comment;
            img.write((output) => {
              const arr = output as Uint8Array;
              // buffer を slice して独立した ArrayBuffer を作成（Transferable にするため）
              // TypeScript の WebWorker lib では .buffer が ArrayBuffer | SharedArrayBuffer になるため cast する
              const outputBuffer = arr.buffer.slice(
                arr.byteOffset,
                arr.byteOffset + arr.byteLength,
              ) as ArrayBuffer;
              resolve({ outputBuffer, comment: comment ?? undefined });
            });
          });
        },
      );

      let finalBuffer: ArrayBuffer;
      if (result.comment) {
        // ImageMagick は EXIF の ImageDescription を非標準 Comment に移すため
        // piexifjs で ImageDescription フィールドに書き戻す
        const binary = Array.from(new Uint8Array(result.outputBuffer))
          .map((b) => String.fromCharCode(b))
          .join("");
        const descriptionBinary = Array.from(new TextEncoder().encode(result.comment))
          .map((b) => String.fromCharCode(b))
          .join("");
        const exifStr = dump({ "0th": { [ImageIFD.ImageDescription]: descriptionBinary } });
        const outputWithExif = insert(exifStr, binary);
        const bytes = Uint8Array.from(outputWithExif.split("").map((c) => c.charCodeAt(0)));
        finalBuffer = bytes.buffer;
      } else {
        finalBuffer = result.outputBuffer;
      }

      const response: ConvertImageResponse = { ok: true, buffer: finalBuffer };
      self.postMessage(response, [finalBuffer]);
    } catch (err) {
      const response: ConvertImageResponse = {
        ok: false,
        message: err instanceof Error ? err.message : String(err),
      };
      self.postMessage(response);
    }
  })();
});
