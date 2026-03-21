export type ImageFormat = "jpg" | "png" | "gif";

interface Options {
  extension: ImageFormat;
}

export async function convertImage(file: File, options: Options): Promise<Blob> {
  const mimeType =
    options.extension === "jpg" ? "image/jpeg"
    : options.extension === "png" ? "image/png"
    : "image/gif";

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        },
        mimeType,
        0.92,
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}
