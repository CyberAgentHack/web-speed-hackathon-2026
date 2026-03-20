interface Options {
  extension: string;
}

export async function convertImage(file: File, options: Options): Promise<Blob> {
  const { initializeImageMagick, ImageMagick, MagickFormat } = await import("@imagemagick/magick-wasm");
  const magickWasmUrl = (await import("@imagemagick/magick-wasm/magick.wasm?binary")).default as unknown as string;
  await initializeImageMagick(magickWasmUrl);

  const format = MagickFormat[options.extension as keyof typeof MagickFormat];
  const byteArray = new Uint8Array(await file.arrayBuffer());

  return new Promise((resolve) => {
    ImageMagick.read(byteArray, (img) => {
      img.format = format;

      img.write((output) => {
        resolve(new Blob([output as Uint8Array<ArrayBuffer>]));
      });
    });
  });
}
