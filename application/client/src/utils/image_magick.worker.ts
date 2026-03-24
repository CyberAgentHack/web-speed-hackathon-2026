/**
 * ImageMagick WASM を Web Worker 内で実行するワーカーファイル。
 * メインスレッドをブロックしないため TBT を削減できる。
 */
import { initializeImageMagick, ImageMagick, MagickFormat } from "@imagemagick/magick-wasm";
import { dump, insert, ImageIFD } from "piexifjs";

let magickInitPromise: Promise<void> | null = null;

function ensureMagickInitialized(): Promise<void> {
  if (!magickInitPromise) {
    magickInitPromise = initializeImageMagick(
      new URL("/magick.wasm", (self as unknown as WorkerGlobalScope).location.origin),
    );
  }
  return magickInitPromise;
}

interface WorkerRequest {
  id: number;
  byteArray: Uint8Array;
  extension: string;
}

interface WorkerResponse {
  id: number;
  result?: Uint8Array;
  error?: string;
}

self.addEventListener("message", async (ev: MessageEvent<WorkerRequest>) => {
  const { id, byteArray, extension } = ev.data;

  try {
    await ensureMagickInitialized();

    const result = await new Promise<Uint8Array>((resolve, reject) => {
      try {
        ImageMagick.read(byteArray, (img) => {
          img.format = extension as MagickFormat;
          const comment = img.comment;

          img.write((output) => {
            if (comment == null) {
              resolve(output as Uint8Array<ArrayBuffer>);
              return;
            }

            // ImageMagick では EXIF の ImageDescription フィールドに保存されているデータが
            // 非標準の Comment フィールドに移されてしまうため
            // piexifjs を使って ImageDescription フィールドに書き込む
            const binary = Array.from(output as Uint8Array<ArrayBuffer>)
              .map((b) => String.fromCharCode(b))
              .join("");
            const descriptionBinary = Array.from(new TextEncoder().encode(comment))
              .map((b) => String.fromCharCode(b))
              .join("");
            const exifStr = dump({ "0th": { [ImageIFD.ImageDescription]: descriptionBinary } });
            const outputWithExif = insert(exifStr, binary);
            const bytes = Uint8Array.from(outputWithExif.split("").map((c) => c.charCodeAt(0)));
            resolve(bytes);
          });
        });
      } catch (err) {
        reject(err);
      }
    });

    (self as unknown as Worker).postMessage({ id, result } as WorkerResponse, [result.buffer]);
  } catch (err) {
    (self as unknown as Worker).postMessage({ error: String(err), id } as WorkerResponse);
  }
});
