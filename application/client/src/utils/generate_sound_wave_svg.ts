const BIN_COUNT = 100;
const WAVEFORM_FILL_COLOR = "#c2410c";

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[idx] ?? 0;
}

function toSvg(peaks: number[]): string {
  const reference = Math.max(percentile(peaks, 0.95), 1e-6);
  const rects = peaks
    .map((peak, idx) => {
      const ratio = Math.min(1, peak / reference);
      return `<rect x="${idx}" y="${(1 - ratio).toFixed(6)}" width="1" height="${ratio.toFixed(6)}" fill="${WAVEFORM_FILL_COLOR}" />`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BIN_COUNT} 1" preserveAspectRatio="none">${rects}</svg>`;
}

function chunkPeaks(values: Float32Array, chunkCount: number): number[] {
  const chunkSize = Math.max(1, Math.ceil(values.length / chunkCount));
  const peaks: number[] = [];

  for (let i = 0; i < chunkCount; i++) {
    const start = i * chunkSize;
    const end = Math.min(values.length, start + chunkSize);
    if (start >= end) {
      peaks.push(0);
      continue;
    }

    let max = 0;
    for (let j = start; j < end; j++) {
      const value = values[j] ?? 0;
      if (value > max) {
        max = value;
      }
    }
    peaks.push(max);
  }

  return peaks;
}

export async function generateSoundWaveSvg(file: Blob): Promise<string> {
  const audioCtx = new AudioContext();
  try {
    const buffer = await audioCtx.decodeAudioData(await file.arrayBuffer());
    const channelData = Array.from({ length: buffer.numberOfChannels }, (_, idx) =>
      buffer.getChannelData(idx),
    );
    const sampleLength = channelData[0]?.length ?? 0;
    const mixedAbs = new Float32Array(sampleLength);

    for (let i = 0; i < sampleLength; i++) {
      let sum = 0;
      for (let ch = 0; ch < channelData.length; ch++) {
        sum += Math.abs(channelData[ch]?.[i] ?? 0);
      }
      mixedAbs[i] = channelData.length > 0 ? sum / channelData.length : 0;
    }

    return toSvg(chunkPeaks(mixedAbs, BIN_COUNT));
  } finally {
    await audioCtx.close();
  }
}
