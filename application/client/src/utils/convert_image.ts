import { initializeImageMagick, ImageMagick, MagickFormat } from "@imagemagick/magick-wasm";

interface Options {
  extension: MagickFormat;
}

export interface ConvertedImage {
  blob: Blob;
  alt: string;
}

let magickWasmPromise: Promise<ArrayBuffer> | null = null;
let initializedImageMagickPromise: Promise<void> | null = null;

async function getImageMagickWasm(): Promise<ArrayBuffer> {
  if (magickWasmPromise != null) {
    return magickWasmPromise;
  }

  magickWasmPromise = fetch("/wasm/magick.wasm", { cache: "force-cache" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load magick.wasm: ${response.status}`);
      }
      return response.arrayBuffer();
    })
    .catch((error: unknown) => {
      magickWasmPromise = null;
      throw error;
    });

  return magickWasmPromise;
}

async function initializeImageMagickOnce() {
  if (initializedImageMagickPromise != null) {
    return initializedImageMagickPromise;
  }

  initializedImageMagickPromise = getImageMagickWasm()
    .then((magickWasm) => initializeImageMagick(magickWasm))
    .catch((error: unknown) => {
      initializedImageMagickPromise = null;
      throw error;
    });

  return initializedImageMagickPromise;
}

export async function convertImage(file: File, options: Options): Promise<ConvertedImage> {
  await initializeImageMagickOnce();

  const byteArray = new Uint8Array(await file.arrayBuffer());

  return new Promise<ConvertedImage>((resolve, reject) => {
    try {
      ImageMagick.read(byteArray, (img) => {
        try {
          img.format = options.extension;
          const alt = typeof img.comment === "string" ? img.comment : "";

          img.write((output) => {
            try {
              resolve({
                blob: new Blob([output as Uint8Array<ArrayBuffer>]),
                alt,
              });
            } catch (error) {
              reject(error);
            }
          });
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}
