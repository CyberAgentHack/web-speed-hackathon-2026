interface Options {
  extension: string;
}

export async function convertImage(file: File, options: Options): Promise<Blob> {
  const img = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context is null");
  ctx.drawImage(img, 0, 0);

  const mimeType = options.extension.toLowerCase() === "png" ? "image/png" : "image/jpeg";
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas to Blob failed"));
      },
      mimeType,
      0.8,
    );
  });
}
