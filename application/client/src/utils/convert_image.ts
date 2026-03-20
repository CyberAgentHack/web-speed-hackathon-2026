interface Options {
  extension: string;
}

interface ConvertImageResult {
  blob: Blob;
  alt: string;
}

export async function convertImage(file: File, options: Options): Promise<ConvertImageResult> {
  const { initializeImageMagick, ImageMagick, MagickFormat } =
    await import("@imagemagick/magick-wasm");
  const { default: magickWasm } = await import("@imagemagick/magick-wasm/magick.wasm?binary");
  const { dump, insert, ImageIFD } = await import("piexifjs");

  await initializeImageMagick(magickWasm);

  const byteArray = new Uint8Array(await file.arrayBuffer());
  const format = MagickFormat[options.extension as keyof typeof MagickFormat] ?? MagickFormat.Jpg;

  return new Promise((resolve) => {
    ImageMagick.read(byteArray, (img) => {
      img.format = format;

      const comment = img.comment ?? "";

      img.write((output) => {
        // piexifjs は JPEG のみ対応のため、JPEG 以外のフォーマットでは exif 埋め込みをスキップする
        if (comment === "" || format !== MagickFormat.Jpg) {
          resolve({ blob: new Blob([output as Uint8Array<ArrayBuffer>]), alt: comment });
          return;
        }

        const binary = Array.from(output as Uint8Array<ArrayBuffer>)
          .map((b) => String.fromCharCode(b))
          .join("");
        const descriptionBinary = Array.from(new TextEncoder().encode(comment))
          .map((b) => String.fromCharCode(b))
          .join("");
        const exifStr = dump({ "0th": { [ImageIFD.ImageDescription]: descriptionBinary } });
        const outputWithExif = insert(exifStr, binary);
        const bytes = Uint8Array.from(outputWithExif.split("").map((c) => c.charCodeAt(0)));
        resolve({ blob: new Blob([bytes]), alt: comment });
      });
    });
  });
}
