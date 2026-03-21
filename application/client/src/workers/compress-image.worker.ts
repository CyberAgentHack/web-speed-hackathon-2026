/** Web Worker for image compression using createImageBitmap + OffscreenCanvas. */

interface WorkerInput {
  buffer: ArrayBuffer;
}

interface WorkerOutput {
  buffer: ArrayBuffer | null;
}

self.onmessage = async (e: MessageEvent<WorkerInput>) => {
  const { buffer } = e.data;

  try {
    const bitmap = await createImageBitmap(new Blob([buffer]));

    const MAX = 1920;
    let { width, height } = bitmap;
    if (width > MAX || height > MAX) {
      const scale = MAX / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 });
    const result = await blob.arrayBuffer();
    self.postMessage({ buffer: result } satisfies WorkerOutput, { transfer: [result] });
  } catch {
    // Format not supported (e.g. TIFF) — signal fallback
    self.postMessage({ buffer: null } satisfies WorkerOutput);
  }
};
