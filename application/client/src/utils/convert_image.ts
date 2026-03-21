import { dump, insert, ImageIFD } from "piexifjs";

interface Options {
  extension: string;
}

export async function convertImage(
  file: File,
  options: Options,
): Promise<{ blob: Blob; alt: string }> {
  const { initializeImageMagick, ImageMagick } = await import("@imagemagick/magick-wasm");
  const { default: magickWasm } = await import("@imagemagick/magick-wasm/magick.wasm?binary");
  await initializeImageMagick(magickWasm);

  const byteArray = new Uint8Array(await file.arrayBuffer());

  return new Promise((resolve) => {
    ImageMagick.read(byteArray, (img) => {
      img.format = options.extension;

      const comment = img.comment;

      img.write((output) => {
        if (comment == null) {
          resolve({ blob: new Blob([output as Uint8Array<ArrayBuffer>]), alt: "" });
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
        resolve({ blob: new Blob([bytes]), alt: comment });
      });
    });
  });
}
