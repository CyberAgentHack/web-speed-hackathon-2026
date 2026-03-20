import { initializeImageMagick, ImageMagick, MagickFormat } from "@imagemagick/magick-wasm";
import magickWasm from "@imagemagick/magick-wasm/magick.wasm?binary";
import { dump, insert, ImageIFD } from "piexifjs";

interface Options {
  extension: MagickFormat;
}

const MAX_IMAGE_DIMENSION = 1280;
const JPEG_QUALITY = 75;

export async function convertImage(file: File, options: Options): Promise<Blob> {
  await initializeImageMagick(magickWasm);

  const byteArray = new Uint8Array(await file.arrayBuffer());

  return new Promise((resolve) => {
    ImageMagick.read(byteArray, (img) => {
      img.format = options.extension;
      const maxDimension = Math.max(img.width, img.height);
      if (maxDimension > MAX_IMAGE_DIMENSION) {
        const scale = MAX_IMAGE_DIMENSION / maxDimension;
        img.resize(Math.round(img.width * scale), Math.round(img.height * scale));
      }
      if (options.extension === MagickFormat.Jpg) {
        img.quality = JPEG_QUALITY;
      }

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
