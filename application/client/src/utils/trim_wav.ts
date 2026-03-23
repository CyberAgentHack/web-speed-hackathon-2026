/**
 * Trim a WAV file to at most `maxSeconds` of audio while preserving all
 * metadata chunks (LIST INFO, etc.).
 *
 * WAV/RIFF layout:
 *   RIFF <size> WAVE
 *     <chunk1> <chunk2> ... (fmt, data, LIST INFO, ...)
 *
 * We copy every chunk as-is except `data`, which we truncate.
 */
export function trimWav(buffer: ArrayBuffer, maxSeconds: number = 1): ArrayBuffer {
  const src = new DataView(buffer);
  const u8 = new Uint8Array(buffer);

  // Validate RIFF/WAVE header
  if (
    src.byteLength < 44 ||
    src.getUint32(0, false) !== 0x52494646 || // "RIFF"
    src.getUint32(8, false) !== 0x57415645    // "WAVE"
  ) {
    return buffer; // Not a valid WAV – return as-is
  }

  // Parse fmt chunk to compute bytes-per-second
  let sampleRate = 44100;
  let blockAlign = 4;
  let offset = 12;

  while (offset + 8 <= src.byteLength) {
    const chunkId = src.getUint32(offset, false);
    const chunkSize = src.getUint32(offset + 4, true);
    if (chunkId === 0x666d7420) {
      // "fmt "
      sampleRate = src.getUint32(offset + 12, true);
      blockAlign = src.getUint16(offset + 20, true);
      break;
    }
    offset += 8 + chunkSize + (chunkSize % 2); // chunks are 2-byte aligned
  }

  const maxDataBytes = Math.ceil(sampleRate * maxSeconds) * blockAlign;

  // Collect all chunks, truncating data
  const chunks: Array<{ id: Uint8Array; body: Uint8Array }> = [];
  let totalPayload = 4; // "WAVE" fourcc
  offset = 12;

  while (offset + 8 <= src.byteLength) {
    const chunkId = src.getUint32(offset, false);
    const chunkSize = src.getUint32(offset + 4, true);
    const bodyStart = offset + 8;
    const bodyEnd = Math.min(bodyStart + chunkSize, src.byteLength);

    if (chunkId === 0x64617461) {
      // "data" – truncate
      const trimmedSize = Math.min(chunkSize, maxDataBytes);
      const header = new Uint8Array(8);
      const hv = new DataView(header.buffer);
      hv.setUint32(0, chunkId, false);
      hv.setUint32(4, trimmedSize, true);
      chunks.push({ id: header, body: u8.slice(bodyStart, bodyStart + trimmedSize) });
      totalPayload += 8 + trimmedSize + (trimmedSize % 2);
    } else {
      // Copy chunk as-is
      const actualSize = bodyEnd - bodyStart;
      chunks.push({ id: u8.slice(offset, offset + 8), body: u8.slice(bodyStart, bodyEnd) });
      totalPayload += 8 + actualSize + (actualSize % 2);
    }

    offset += 8 + chunkSize + (chunkSize % 2);
  }

  // Build output
  const out = new ArrayBuffer(8 + totalPayload);
  const ov = new DataView(out);
  const ou = new Uint8Array(out);

  ov.setUint32(0, 0x52494646, false); // "RIFF"
  ov.setUint32(4, totalPayload, true);
  ov.setUint32(8, 0x57415645, false); // "WAVE"

  let pos = 12;
  for (const chunk of chunks) {
    ou.set(chunk.id, pos);
    pos += chunk.id.length;
    ou.set(chunk.body, pos);
    pos += chunk.body.length;
    if (chunk.body.length % 2 !== 0) {
      pos += 1; // padding byte
    }
  }

  return out;
}
