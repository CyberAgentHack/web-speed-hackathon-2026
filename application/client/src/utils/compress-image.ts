/** Extract ImageDescription (tag 0x010E) from TIFF IFD header. */
function extractTiffAlt(buf: ArrayBuffer): string {
  const view = new DataView(buf);
  if (buf.byteLength < 8) return "";
  const magic = view.getUint16(0);
  const isBE = magic === 0x4d4d;
  const isLE = magic === 0x4949;
  if (!isBE && !isLE) return "";
  const r16 = (o: number) => view.getUint16(o, isLE);
  const r32 = (o: number) => view.getUint32(o, isLE);
  const ifdOffset = r32(4);
  if (ifdOffset + 2 > buf.byteLength) return "";
  const n = r16(ifdOffset);
  for (let i = 0; i < n; i++) {
    const off = ifdOffset + 2 + i * 12;
    if (off + 12 > buf.byteLength) break;
    if (r16(off) === 0x010e) {
      const count = r32(off + 4);
      const valOff = count <= 4 ? off + 8 : r32(off + 8);
      if (valOff + count > buf.byteLength) return "";
      const bytes = new Uint8Array(buf, valOff, count);
      let end = bytes.length;
      while (end > 0 && bytes[end - 1] === 0) end--;
      return new TextDecoder().decode(bytes.subarray(0, end));
    }
  }
  return "";
}

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("../workers/compress-image.worker.ts", import.meta.url), {
      type: "module",
    });
  }
  return worker;
}

/** Compress image off main thread. Returns { file, alt }. */
export async function compressImage(file: File): Promise<{ file: File; alt: string }> {
  const buf = await file.arrayBuffer();
  const alt = extractTiffAlt(buf);

  try {
    const w = getWorker();
    const result = await new Promise<ArrayBuffer | null>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("timeout")), 15_000);
      w.onmessage = (e: MessageEvent<{ buffer: ArrayBuffer | null }>) => {
        clearTimeout(timeout);
        resolve(e.data.buffer);
      };
      w.onerror = (e) => {
        clearTimeout(timeout);
        reject(e);
      };
      w.postMessage({ buffer: buf }, [buf]);
    });

    if (result) {
      return { file: new File([result], "image.jpg", { type: "image/jpeg" }), alt };
    }
    // Worker signaled fallback (e.g. TIFF not decodable)
    return { file, alt };
  } catch {
    return { file, alt };
  }
}
