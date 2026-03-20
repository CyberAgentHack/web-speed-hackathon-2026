import { initializeImageMagick, ImageMagick, MagickFormat } from "@imagemagick/magick-wasm";
import { dump, insert, ImageIFD } from "piexifjs";

import {
  binaryStringToBytes,
  bytesToBinaryString,
} from "@web-speed-hackathon-2026/client/src/utils/binary";

interface Options {
  extension: MagickFormat;
}

async function getImageMagickWasm(): Promise<ArrayBuffer> {
  const response = await fetch('/wasm/magick.wasm');
  return response.arrayBuffer();
}

export async function convertImage(file: File, options: Options): Promise<Blob> {
  const magickWasm = await getImageMagickWasm();
  await initializeImageMagick(magickWasm);

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
        const binary = bytesToBinaryString(output as Uint8Array<ArrayBuffer>);
        const descriptionBinary = bytesToBinaryString(new TextEncoder().encode(comment));
        const exifStr = dump({ "0th": { [ImageIFD.ImageDescription]: descriptionBinary } });
        const outputWithExif = insert(exifStr, binary);
        const outputBytes = binaryStringToBytes(outputWithExif);
        const outputBuffer = new ArrayBuffer(outputBytes.byteLength);
        new Uint8Array(outputBuffer).set(outputBytes);
        resolve(new Blob([outputBuffer]));
      });
    });
  });
}
