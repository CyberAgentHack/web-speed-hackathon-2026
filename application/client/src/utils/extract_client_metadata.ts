function readAscii(view: DataView, offset: number, length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += String.fromCharCode(view.getUint8(offset + i));
  }
  return result;
}

// --- Sound: RIFF INFO metadata ---

function findRiffTag(data: Uint8Array, view: DataView, tag: string): Uint8Array | null {
  const c0 = tag.charCodeAt(0);
  const c1 = tag.charCodeAt(1);
  const c2 = tag.charCodeAt(2);
  const c3 = tag.charCodeAt(3);

  for (let i = 0; i < data.length - 8; i++) {
    if (data[i] === c0 && data[i + 1] === c1 && data[i + 2] === c2 && data[i + 3] === c3) {
      const size = view.getUint32(i + 4, true);
      const end = Math.min(i + 8 + size, data.length);
      const chunk = data.subarray(i + 8, end);
      const nullIdx = chunk.indexOf(0);
      return nullIdx === -1 ? chunk : chunk.subarray(0, nullIdx);
    }
  }
  return null;
}

function decodeText(raw: Uint8Array): string {
  if (raw.some((b) => b >= 0x80)) {
    try {
      return new TextDecoder("shift_jis").decode(raw);
    } catch {
      // fallthrough
    }
  }
  return new TextDecoder("utf-8").decode(raw);
}

export function extractSoundMetadata(buffer: ArrayBuffer): { title?: string; artist?: string } {
  const data = new Uint8Array(buffer);
  const view = new DataView(buffer);

  if (data.length < 12) return {};
  if (readAscii(view, 0, 4) !== "RIFF" || readAscii(view, 8, 4) !== "WAVE") return {};

  const titleRaw = findRiffTag(data, view, "INAM");
  const artistRaw = findRiffTag(data, view, "IART");

  if (!titleRaw && !artistRaw) return {};

  return {
    title: titleRaw ? decodeText(titleRaw) : undefined,
    artist: artistRaw ? decodeText(artistRaw) : undefined,
  };
}

// --- Sound: WAV peaks computation ---

const PEAK_COUNT = 100;

interface PeaksData {
  max: number;
  peaks: number[];
}

function findWavChunk(view: DataView, startOffset: number, id: string, bufLen: number): { offset: number; size: number } | null {
  let pos = startOffset;
  while (pos < bufLen - 8) {
    const chunkId = readAscii(view, pos, 4);
    const chunkSize = view.getUint32(pos + 4, true);
    if (chunkId === id) {
      return { offset: pos + 8, size: chunkSize };
    }
    pos += 8 + chunkSize;
    if (chunkSize % 2 !== 0) pos++;
  }
  return null;
}

export function computeWavPeaks(buffer: ArrayBuffer): PeaksData | null {
  if (buffer.byteLength < 44) return null;
  const view = new DataView(buffer);
  const data = new Uint8Array(buffer);

  if (readAscii(view, 0, 4) !== "RIFF" || readAscii(view, 8, 4) !== "WAVE") return null;

  const fmt = findWavChunk(view, 12, "fmt ", buffer.byteLength);
  const dataChunk = findWavChunk(view, 12, "data", buffer.byteLength);
  if (!fmt || !dataChunk) return null;

  const audioFormat = view.getUint16(fmt.offset, true);
  if (audioFormat !== 1) return null;

  const numChannels = view.getUint16(fmt.offset + 2, true);
  const bitsPerSample = view.getUint16(fmt.offset + 14, true);
  const bytesPerSample = bitsPerSample / 8;
  const totalSamples = Math.floor(dataChunk.size / (bytesPerSample * numChannels));
  if (totalSamples === 0) return null;

  const chunkSize = Math.ceil(totalSamples / PEAK_COUNT);
  const peaks: number[] = [];
  const dataStart = dataChunk.offset;

  for (let i = 0; i < totalSamples; i += chunkSize) {
    let sum = 0;
    const end = Math.min(i + chunkSize, totalSamples);
    for (let j = i; j < end; j++) {
      let mono = 0;
      for (let ch = 0; ch < numChannels; ch++) {
        const off = dataStart + (j * numChannels + ch) * bytesPerSample;
        if (off + bytesPerSample > data.length) break;
        let s: number;
        if (bitsPerSample === 16) {
          s = view.getInt16(off, true) / 32768;
        } else if (bitsPerSample === 8) {
          s = (data[off]! - 128) / 128;
        } else if (bitsPerSample === 24) {
          s = ((data[off + 2]! << 24) | (data[off + 1]! << 16) | (data[off]! << 8)) >> 8;
          s /= 8388608;
        } else if (bitsPerSample === 32) {
          s = view.getInt32(off, true) / 2147483648;
        } else {
          s = 0;
        }
        mono += s;
      }
      sum += Math.abs(mono / numChannels);
    }
    peaks.push(sum / (end - i));
  }

  let max = 0;
  for (const p of peaks) {
    if (p > max) max = p;
  }

  return { max, peaks };
}

// --- Image: EXIF ImageDescription ---

function readIfdDescription(view: DataView, tiffOffset: number, isLE: boolean): string {
  const ifdOff = view.getUint32(tiffOffset + 4, isLE);
  const ifdStart = tiffOffset + ifdOff;
  const count = view.getUint16(ifdStart, isLE);

  for (let i = 0; i < count; i++) {
    const entry = ifdStart + 2 + i * 12;
    if (view.getUint16(entry, isLE) === 0x010e) {
      const len = view.getUint32(entry + 4, isLE);
      const valOff = len <= 4 ? entry + 8 : tiffOffset + view.getUint32(entry + 8, isLE);
      const raw = new Uint8Array(view.buffer, valOff, len);
      const end = raw.indexOf(0);
      return new TextDecoder("utf-8").decode(raw.subarray(0, end === -1 ? len : end));
    }
  }
  return "";
}

export function extractImageAlt(buffer: ArrayBuffer): string {
  try {
    if (buffer.byteLength < 12) return "";
    const view = new DataView(buffer);
    const bom = view.getUint16(0, false);

    if (bom === 0x4949 || bom === 0x4d4d) {
      return readIfdDescription(view, 0, bom === 0x4949);
    }

    let off = 2;
    while (off < buffer.byteLength - 4) {
      const marker = view.getUint16(off, false);
      if (marker === 0xffe1) {
        const segLen = view.getUint16(off + 2, false);
        if (readAscii(view, off + 4, 6) === "Exif\0\0") {
          const tOff = off + 10;
          return readIfdDescription(view, tOff, view.getUint16(tOff, false) === 0x4949);
        }
        off += 2 + segLen;
      } else if ((marker & 0xff00) === 0xff00) {
        off += 2 + view.getUint16(off + 2, false);
      } else {
        break;
      }
    }
  } catch {
    // ignore parse errors
  }
  return "";
}
