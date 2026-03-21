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
          // Strip trailing nulls
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

  return { title, artist } as { title?: string; artist?: string };
}

/** Encode AudioBuffer as WAV (mono, 16-bit PCM). */
function encodeWAV(audioBuffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = audioBuffer.sampleRate;
  const samples = audioBuffer.getChannelData(0);
  const bytesPerSample = 2;
  const dataLength = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // subchunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]!));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

/** Compress audio: downsample to mono 22050Hz WAV. Returns { file, title, artist }. */
export async function compressAudio(
  file: File,
): Promise<{ file: File; title?: string; artist?: string }> {
  const buf = await file.arrayBuffer();
  const { title, artist } = extractRiffInfo(buf);

  const targetRate = 22050;
  const audioCtx = new AudioContext({ sampleRate: targetRate });
  const decoded = await audioCtx.decodeAudioData(buf.slice(0));
  await audioCtx.close();

  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * targetRate), targetRate);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const rendered = await offline.startRendering();

  const wavBlob = encodeWAV(rendered);
  const compressed = new File([wavBlob], "audio.wav", { type: "audio/wav" });
  return { file: compressed, title, artist } as { file: File; title?: string; artist?: string };
}
