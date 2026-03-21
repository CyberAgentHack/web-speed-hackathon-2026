/** Extract RIFF INFO metadata (INAM=title, IART=artist) from WAV file. */
function extractRiffInfo(buf: ArrayBuffer): { title?: string; artist?: string } {
  const data = new Uint8Array(buf);
  if (data.length < 12) return {};
  const decoder = new TextDecoder("ascii");
  const riff = decoder.decode(data.subarray(0, 4));
  const wave = decoder.decode(data.subarray(8, 12));
  if (riff !== "RIFF" || wave !== "WAVE") return {};

  let title: string | undefined;
  let artist: string | undefined;
  const view = new DataView(buf);
  let offset = 12;

  while (offset + 8 <= data.length) {
    const chunkId = decoder.decode(data.subarray(offset, offset + 4));
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === "LIST" && offset + 12 <= data.length) {
      const listType = decoder.decode(data.subarray(offset + 8, offset + 12));
      if (listType === "INFO") {
        let subOffset = offset + 12;
        const listEnd = offset + 8 + chunkSize;
        while (subOffset + 8 <= listEnd && subOffset + 8 <= data.length) {
          const subId = decoder.decode(data.subarray(subOffset, subOffset + 4));
          const subSize = view.getUint32(subOffset + 4, true);
          const valueEnd = Math.min(subOffset + 8 + subSize, data.length);
          const valueBytes = data.subarray(subOffset + 8, valueEnd);
          let end = valueBytes.length;
          while (end > 0 && valueBytes[end - 1] === 0) end--;
          const trimmed = valueBytes.subarray(0, end);
          let str: string;
          try {
            str = new TextDecoder("utf-8", { fatal: true }).decode(trimmed);
          } catch {
            str = new TextDecoder("shift_jis").decode(trimmed);
          }
          if (subId === "INAM") title = str;
          if (subId === "IART") artist = str;
          subOffset += 8 + subSize;
          if (subSize % 2 !== 0) subOffset++;
        }
        break;
      }
    }
    offset += 8 + chunkSize;
    if (chunkSize % 2 !== 0) offset++;
  }

  const result: { title?: string; artist?: string } = {};
  if (title !== undefined) result.title = title;
  if (artist !== undefined) result.artist = artist;
  return result;
}

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("../workers/compress-audio.worker.ts", import.meta.url), {
      type: "module",
    });
  }
  return worker;
}

/** Compress audio off main thread. Returns { file, title, artist }. */
export async function compressAudio(
  file: File,
): Promise<{ file: File; title?: string; artist?: string }> {
  const buf = await file.arrayBuffer();
  const meta = extractRiffInfo(buf);

  const makeResult = (f: File): { file: File; title?: string; artist?: string } => {
    const r: { file: File; title?: string; artist?: string } = { file: f };
    if (meta.title !== undefined) r.title = meta.title;
    if (meta.artist !== undefined) r.artist = meta.artist;
    return r;
  };

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
      return makeResult(new File([result], "audio.wav", { type: "audio/wav" }));
    }
    return makeResult(file);
  } catch {
    return makeResult(file);
  }
}
