import type { MagickFormat } from "@imagemagick/magick-wasm";

interface Options {
  extension: keyof typeof MagickFormat;
}

export async function convertImage(file: File, options: Options): Promise<Blob> {
  const [
    { initializeImageMagick, ImageMagick, MagickFormat },
    magickWasmBuffer,
    { dump, insert, ImageIFD },
  ] = await Promise.all([
    import("@imagemagick/magick-wasm"),
    fetch("/wasm/magick.wasm").then((r) => {
      if (!r.ok) throw new Error(`Failed to fetch magick.wasm: ${r.status}`);
      return r.arrayBuffer();
    }),
    import("piexifjs"),
  ]);

  await initializeImageMagick(new Uint8Array(magickWasmBuffer));

  const format = MagickFormat[options.extension];
  const byteArray = new Uint8Array(await file.arrayBuffer());

  return new Promise((resolve) => {
    ImageMagick.read(byteArray, (img) => {
      img.format = format;

      const comment = img.comment;

      img.write((output) => {
        // piexifjs の EXIF 挿入は JPEG のみ対応。WebP 等はそのまま返す
        if (comment == null || format !== MagickFormat.Jpg) {
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
