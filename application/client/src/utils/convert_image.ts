import type { MagickFormat } from "@imagemagick/magick-wasm";
import { initializeImageMagick, ImageMagick } from "@imagemagick/magick-wasm";
import { dump, insert, ImageIFD } from "piexifjs";

interface Options {
  extension: MagickFormat;
}

let magickInitialized = false;

async function ensureImageMagickInitialized(): Promise<void> {
  if (magickInitialized) return;

  const wasmUrl = new URL(
    "https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.37/dist/magick.wasm",
  );

  await initializeImageMagick(wasmUrl);
  magickInitialized = true;
}

export async function convertImage(
  file: File,
  options: Options,
): Promise<Blob> {
  await ensureImageMagickInitialized();

  const byteArray = new Uint8Array(await file.arrayBuffer());

  return new Promise((resolve) => {
    ImageMagick.read(byteArray, (img) => {
      img.format = options.extension;

      const comment = img.comment;

      img.write((output) => {
        if (comment == null) {
          resolve(new Blob([output as Uint8Array<ArrayBuffer>]));
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
        const exifStr = dump({
          "0th": { [ImageIFD.ImageDescription]: descriptionBinary },
        });
        const outputWithExif = insert(exifStr, binary);
        const bytes = Uint8Array.from(
          outputWithExif.split("").map((c) => c.charCodeAt(0)),
        );
        resolve(new Blob([bytes]));
      });
    });
  });
}
