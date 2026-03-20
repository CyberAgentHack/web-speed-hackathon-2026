import { initializeImageMagick, ImageMagick, MagickFormat } from "@imagemagick/magick-wasm";

interface Options {
  extension: MagickFormat;
}

export async function convertImage(file: File, options: Options): Promise<Blob> {
  const magickWasmUrl = (await import("@imagemagick/magick-wasm/magick.wasm?binary")).default as unknown as string;
  await initializeImageMagick(magickWasmUrl);

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
