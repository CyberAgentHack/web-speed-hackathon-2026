import { initializeImageMagick, ImageMagick, MagickFormat } from "@imagemagick/magick-wasm";
import magickWasmUrl from "@imagemagick/magick-wasm/magick.wasm?url";

interface Options {
  extension: MagickFormat;
}

interface ConvertResult {
  blob: Blob;
  alt: string;
}

export async function convertImage(file: File, options: Options): Promise<ConvertResult> {
  const wasmResponse = await fetch(magickWasmUrl);
  const wasmBinary = new Uint8Array(await wasmResponse.arrayBuffer());
  await initializeImageMagick(wasmBinary);

  const byteArray = new Uint8Array(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    try {
      ImageMagick.read(byteArray, (img) => {
        const alt = img.getAttribute("exif:ImageDescription") ?? "";

        img.format = options.extension;

        img.write((output) => {
          resolve({ blob: new Blob([output as Uint8Array<ArrayBuffer>]), alt });
        });
      });
    } catch (err) {
      reject(err);
    }
  });
}
