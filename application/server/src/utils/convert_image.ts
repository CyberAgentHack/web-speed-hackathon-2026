import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
} from "@imagemagick/magick-wasm";
import path from "path";
import { promises as fs } from "fs";
import piexif from "piexifjs";

let isMagickInitialized = false;
export async function initMagick(): Promise<void> {
  if (isMagickInitialized) {
    return;
  }

  const wasmPath = path.resolve(
    process.cwd(),
    "node_modules",
    "@imagemagick",
    "magick-wasm",
    "dist",
    "magick.wasm",
  );

  const wasmBuf = await fs.readFile(wasmPath);
  const wasmArray = new Uint8Array(wasmBuf);

  await initializeImageMagick(wasmArray);
  isMagickInitialized = true;
}

interface Options {
  extension: MagickFormat;
}

export async function convertImage(
  buf: Buffer,
  options: Options,
): Promise<Buffer> {
  await initMagick();

  return new Promise((resolve) => {
    ImageMagick.read(buf, (img) => {
      img.format = options.extension;

      const comment = img.comment;

      img.write((output) => {
        if (comment == null) {
          resolve(Buffer.from(output));
          return;
        }

        const binary = Buffer.from(output).toString("binary");
        const descriptionBinary = Buffer.from(comment).toString("binary");

        const exifStr = piexif.dump({
          "0th": { [piexif.ImageIFD.ImageDescription]: descriptionBinary },
        });

        const outputWithExif = piexif.insert(exifStr, binary);
        resolve(Buffer.from(outputWithExif, "binary"));
      });
    });
  });
}
