interface Options {
  extension: string;
}

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, { resolve: (blob: Blob) => void; reject: (err: Error) => void }>();

function getImageMagickWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      /* webpackChunkName: "image-magick-worker" */
      new URL("./image_magick.worker", import.meta.url),
      { type: "module" },
    );
    worker.onmessage = (ev: MessageEvent) => {
      const { id, result, error } = ev.data as { id: number; result?: Uint8Array; error?: string };
      const p = pending.get(id);
      if (!p) return;
      pending.delete(id);
      if (error != null) {
        p.reject(new Error(error));
      } else {
        p.resolve(new Blob([result!]));
      }
    };
    worker.onerror = (ev) => {
      for (const [id, p] of pending) {
        p.reject(new Error(`Worker error: ${ev.message}`));
        pending.delete(id);
      }
    };
  }
  return worker;
}

export async function convertImage(file: File, options: Options): Promise<Blob> {
  const byteArray = new Uint8Array(await file.arrayBuffer());
  const id = nextId++;

  return new Promise<Blob>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getImageMagickWorker().postMessage({ byteArray, extension: options.extension, id }, [
      byteArray.buffer,
    ]);
  });
}
