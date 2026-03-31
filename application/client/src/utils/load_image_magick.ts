import { initializeImageMagick } from "@imagemagick/magick-wasm";
import magickWasm from "@imagemagick/magick-wasm/magick.wasm?binary";

let imageMagickPromise: Promise<void> | null = null;

export async function preloadImageMagick(): Promise<void> {
  imageMagickPromise ??= initializeImageMagick(magickWasm);
  await imageMagickPromise;
}
