import { initializeImageMagick, ImageMagick, MagickFormat } from "@imagemagick/magick-wasm";
import { dump, insert, ImageIFD } from "piexifjs";

const MAGICK_WASM_VERSION = "0.0.37";
const MAGICK_WASM_URL = `https://unpkg.com/@imagemagick/magick-wasm@${MAGICK_WASM_VERSION}/dist/magick.wasm`;

let initializePromise: Promise<void> | null = null;

async function ensureImageMagickInitialized(): Promise<void> {
  if (initializePromise == null) {
    initializePromise = (async () => {
      const response = await fetch(MAGICK_WASM_URL);
      if (response.ok !== true) {
        throw new Error(`Failed to fetch ImageMagick wasm: ${MAGICK_WASM_URL}`);
      }

      const wasm = new Uint8Array(await response.arrayBuffer());
      await initializeImageMagick(wasm);
    })();
  }

  try {
    await initializePromise;
  } catch (error) {
    initializePromise = null;
    throw error;
  }
}

interface Options {
  extension: MagickFormat;
}

export async function convertImage(file: File, options: Options): Promise<Blob> {
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
        const exifStr = dump({ "0th": { [ImageIFD.ImageDescription]: descriptionBinary } });
        const outputWithExif = insert(exifStr, binary);
        const bytes = Uint8Array.from(outputWithExif.split("").map((c) => c.charCodeAt(0)));
        resolve(new Blob([bytes]));
      });
    });
  });
}
