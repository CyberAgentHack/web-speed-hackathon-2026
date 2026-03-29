interface Options {
  extension: "jpg" | "webp";
}

interface ConvertImageResult {
  alt: string;
  blob: Blob;
}

export async function convertImage(file: File, options: Options): Promise<ConvertImageResult> {
  const [{ initializeImageMagick, ImageMagick, MagickFormat }, wasmUrl] = await Promise.all([
    import("@imagemagick/magick-wasm"),
    import("@imagemagick/magick-wasm/magick.wasm?binary").then((mod) => mod.default),
  ]);

  const wasmBytes = await fetch(wasmUrl as unknown as string).then(async (response) => {
    return await response.arrayBuffer();
  });
  await initializeImageMagick(new Uint8Array(wasmBytes));

  const byteArray = new Uint8Array(await file.arrayBuffer());

  return new Promise((resolve) => {
    ImageMagick.read(byteArray, (img) => {
      img.format = options.extension === "webp" ? MagickFormat.WebP : MagickFormat.Jpg;

      const comment = img.comment?.trim() ?? "";

      img.write((output) => {
        if (comment === "" || options.extension !== "jpg") {
          resolve({
            alt: comment,
            blob: new Blob([output as Uint8Array<ArrayBuffer>]),
          });
          return;
        }

        const saveWithExif = async () => {
          const { dump, insert, ImageIFD } = await import("piexifjs");

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
          resolve({
            alt: comment,
            blob: new Blob([bytes]),
          });
        };

        void saveWithExif().catch(() => {
          resolve({
            alt: comment,
            blob: new Blob([output as Uint8Array<ArrayBuffer>]),
          });
        });
      });
    });
  });
}
