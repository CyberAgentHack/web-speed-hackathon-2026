import { ImageIFD, load } from "piexifjs";

interface Options {
  extension: "avif" | "jpg";
}

const MAX_IMAGE_DIMENSION = 1280;
const AVIF_QUALITY = 50;
const JPEG_QUALITY = 75;

interface ConvertedImage {
  alt: string;
  blob: Blob;
}

function getOutputSettings(extension: Options["extension"]) {
  if (extension === "avif") {
    return {
      mimeType: "image/avif",
      quality: AVIF_QUALITY / 100,
    };
  }

  return {
    mimeType: "image/jpeg",
    quality: JPEG_QUALITY / 100,
  };
}

function decodeExifString(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    return "";
  }

  const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes).replace(/\0+$/u, "");
}

async function extractAlt(file: File): Promise<string> {
  try {
    const binary = new TextDecoder("latin1").decode(new Uint8Array(await file.arrayBuffer()));
    const exif = load(binary);
    const value = exif["0th"]?.[ImageIFD.ImageDescription];
    return decodeExifString(value);
  } catch {
    return "";
  }
}

async function convertImageWithCanvas(file: File, options: Options): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const maxDimension = Math.max(bitmap.width, bitmap.height);
  const scale = maxDimension > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / maxDimension : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const { mimeType, quality } = getOutputSettings(options.extension);

  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");
    if (context == null) {
      throw new Error("Failed to create 2d context");
    }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return await canvas.convertToBlob({ quality, type: mimeType });
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (context == null) {
    bitmap.close();
    throw new Error("Failed to create 2d context");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob == null) {
          reject(new Error("Failed to convert image"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

async function convertImageWithImageMagick(file: File, options: Options): Promise<Blob> {
  const [{ ImageMagick, MagickFormat, initializeImageMagick }, { default: magickWasm }] =
    await Promise.all([
      import(/* webpackChunkName: "feature-image-tools-magick" */ "@imagemagick/magick-wasm"),
      import(
        /* webpackChunkName: "feature-image-tools-magick" */ "@imagemagick/magick-wasm/magick.wasm?binary"
      ),
    ]);
  await initializeImageMagick(magickWasm);

  const byteArray = new Uint8Array(await file.arrayBuffer());

  return await new Promise((resolve) => {
    ImageMagick.read(byteArray, (img) => {
      img.format = options.extension === "avif" ? MagickFormat.Avif : MagickFormat.Jpg;
      const maxDimension = Math.max(img.width, img.height);
      if (maxDimension > MAX_IMAGE_DIMENSION) {
        const scale = MAX_IMAGE_DIMENSION / maxDimension;
        img.resize(Math.round(img.width * scale), Math.round(img.height * scale));
      }
      img.quality = options.extension === "avif" ? AVIF_QUALITY : JPEG_QUALITY;

      img.write((output) => {
        resolve(new Blob([output as Uint8Array<ArrayBuffer>]));
      });
    });
  });
}

export async function convertImage(file: File, options: Options): Promise<ConvertedImage> {
  const alt = await extractAlt(file);

  try {
    const blob = await convertImageWithCanvas(file, options);
    return { alt, blob };
  } catch {
    const blob = await convertImageWithImageMagick(file, options);
    return { alt, blob };
  }
}
