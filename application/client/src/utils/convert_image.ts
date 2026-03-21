export async function convertImage(file: File, quality = 0.85): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    return canvas.convertToBlob({ type: "image/jpeg", quality });
  } catch {
    // TIFF等、createImageBitmapが非対応のフォーマットはそのまま返す
    return file;
  }
}
