import { initializeImageMagick, ImageMagick, MagickFormat } from "@imagemagick/magick-wasm";
import magickWasmUrl from "@imagemagick/magick-wasm/magick.wasm?binary";

interface Options {
  extension: MagickFormat;
}

export async function convertImage(file: File, options: Options): Promise<Blob> {
  await initializeImageMagick(new URL(magickWasmUrl, location.origin));

  const byteArray = new Uint8Array(await file.arrayBuffer());

  return new Promise((resolve) => {
    ImageMagick.read(byteArray, (img) => {
      img.format = options.extension;

      img.write((output) => {
        resolve(new Blob([output as Uint8Array<ArrayBuffer>]));
      });
    });
  });
}
