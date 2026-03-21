export type ImageFormat = "jpg" | "png" | "gif";

interface Options {
  extension: ImageFormat;
}

export async function convertImage(file: File, options: Options): Promise<Blob> {
  const [
    { initializeImageMagick, ImageMagick, MagickFormat },
    { default: magickWasm },
    { dump, insert, ImageIFD },
  ] = await Promise.all([
    import("@imagemagick/magick-wasm"),
    import("@imagemagick/magick-wasm/magick.wasm?url"),
    import("piexifjs"),
  ]);

  const fmt =
    options.extension === "jpg" ? MagickFormat.Jpg
    : options.extension === "png" ? MagickFormat.Png
    : MagickFormat.Gif;

  await initializeImageMagick(magickWasm);

  const byteArray = new Uint8Array(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    try {
      ImageMagick.read(byteArray, (img) => {
        try {
          img.format = fmt;

          const comment = img.comment ?? img.getAttribute("exif:ImageDescription");

          img.write((output) => {
            try {
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
            } catch (e) {
              reject(e);
            }
          });
        } catch (e) {
          reject(e);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}
