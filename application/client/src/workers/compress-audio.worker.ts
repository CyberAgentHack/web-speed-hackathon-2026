/** Web Worker for audio compression: manual WAV parsing, 2:1 decimation, mono mixdown. */

interface WorkerInput {
  buffer: ArrayBuffer;
}

interface WorkerOutput {
  buffer: ArrayBuffer | null;
}

/** Parse WAV header and extract PCM data. */
function parseWav(buf: ArrayBuffer): {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  pcmData: DataView;
  pcmOffset: number;
  pcmLength: number;
} | null {
  const view = new DataView(buf);
  const data = new Uint8Array(buf);
  if (data.length < 44) return null;

  const decoder = new TextDecoder("ascii");
  const riff = decoder.decode(data.subarray(0, 4));
  const wave = decoder.decode(data.subarray(8, 12));
  if (riff !== "RIFF" || wave !== "WAVE") return null;

  // Find fmt and data chunks
  let sampleRate = 0;
  let channels = 0;
  let bitsPerSample = 0;
  let pcmOffset = 0;
  let pcmLength = 0;
  let offset = 12;

  while (offset + 8 <= data.length) {
    const chunkId = decoder.decode(data.subarray(offset, offset + 4));
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === "fmt ") {
      channels = view.getUint16(offset + 10, true);
      sampleRate = view.getUint32(offset + 12, true);
      bitsPerSample = view.getUint16(offset + 22, true);
    } else if (chunkId === "data") {
      pcmOffset = offset + 8;
      pcmLength = chunkSize;
      break;
    }

    offset += 8 + chunkSize;
    if (chunkSize % 2 !== 0) offset++;
  }

  if (sampleRate === 0 || pcmLength === 0) return null;

  return { sampleRate, channels, bitsPerSample, pcmData: view, pcmOffset, pcmLength };
}

/** Encode mono 16-bit PCM samples as WAV. */
function encodeWav(samples: Int16Array, sampleRate: number): ArrayBuffer {
  const bytesPerSample = 2;
  const dataLength = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeStr = (off: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataLength, true);

  const out = new Int16Array(buffer, 44);
  out.set(samples);

  return buffer;
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { buffer } = e.data;

  try {
    const wav = parseWav(buffer);
    if (!wav) {
      self.postMessage({ buffer: null } satisfies WorkerOutput);
      return;
    }

    const { sampleRate, channels, bitsPerSample, pcmData, pcmOffset, pcmLength } = wav;

    if (bitsPerSample !== 16) {
      // Only handle 16-bit PCM; fallback for other formats
      self.postMessage({ buffer: null } satisfies WorkerOutput);
      return;
    }

    const totalSamples = pcmLength / (bitsPerSample / 8);
    const framesCount = totalSamples / channels;

    // Target: mono 22050Hz
    const targetRate = 22050;
    const ratio = sampleRate / targetRate;
    const outFrames = Math.floor(framesCount / ratio);
    const outSamples = new Int16Array(outFrames);

    for (let i = 0; i < outFrames; i++) {
      const srcFrame = Math.floor(i * ratio);
      const byteOffset = pcmOffset + srcFrame * channels * 2;

      if (channels === 1) {
        outSamples[i] = pcmData.getInt16(byteOffset, true);
      } else {
        // Mix channels to mono
        let sum = 0;
        for (let ch = 0; ch < channels; ch++) {
          sum += pcmData.getInt16(byteOffset + ch * 2, true);
        }
        outSamples[i] = Math.round(sum / channels);
      }
    }

    const result = encodeWav(outSamples, targetRate);
    self.postMessage({ buffer: result } satisfies WorkerOutput, { transfer: [result] });
  } catch {
    self.postMessage({ buffer: null } satisfies WorkerOutput);
  }
};
