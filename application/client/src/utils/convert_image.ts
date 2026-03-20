import { initializeImageMagick, ImageMagick, MagickFormat } from "@imagemagick/magick-wasm";
import magickWasm from "@imagemagick/magick-wasm/magick.wasm?binary";
import { dump, insert, ImageIFD } from "piexifjs";

interface Options {
  extension: MagickFormat;
}

interface ConvertedImage {
  alt: string;
  blob: Blob;
}

const MAX_IMAGE_DIMENSION = 1600;

export async function convertImage(file: File, options: Options): Promise<ConvertedImage> {
  await initializeImageMagick(magickWasm);

  const byteArray = new Uint8Array(await file.arrayBuffer());

  return new Promise((resolve) => {
    ImageMagick.read(byteArray, (img) => {
      const longestEdge = Math.max(img.width, img.height);
      if (longestEdge > MAX_IMAGE_DIMENSION) {
        const scale = MAX_IMAGE_DIMENSION / longestEdge;
        img.resize(Math.round(img.width * scale), Math.round(img.height * scale));
      }

      img.format = options.extension;

      const comment = img.comment ?? "";

      img.write((output) => {
        if (comment === "") {
          resolve({ alt: "", blob: new Blob([output as Uint8Array<ArrayBuffer>]) });
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
        resolve({ alt: comment, blob: new Blob([bytes]) });
      });
    });
  });
}
