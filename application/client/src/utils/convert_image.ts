import { initializeImageMagick, ImageMagick, MagickFormat } from "@imagemagick/magick-wasm";
import magickWasm from "@imagemagick/magick-wasm/magick.wasm?binary";

interface Options {
  extension: MagickFormat;
}

interface ConvertResult {
  blob: Blob;
  alt: string;
}

export async function convertImage(file: File, options: Options): Promise<ConvertResult> {
  await initializeImageMagick(magickWasm);

  const byteArray = new Uint8Array(await file.arrayBuffer());

  return new Promise((resolve) => {
    ImageMagick.read(byteArray, (img) => {
      // EXIF の ImageDescription は ImageMagick では comment として読める
      const alt = img.comment ?? "";

      img.format = options.extension;

      img.write((output) => {
        resolve({
          blob: new Blob([output as Uint8Array<ArrayBuffer>]),
          alt,
        });
      });
    });
  });
}
