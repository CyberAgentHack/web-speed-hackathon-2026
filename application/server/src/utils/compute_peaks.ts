import audioDecode from "audio-decode";

interface PeaksData {
  max: number;
  peaks: number[];
}

export async function computePeaks(buffer: Buffer): Promise<PeaksData> {
  const { channelData } = await audioDecode(buffer);

  const left = channelData[0]!;
  const right = channelData.length > 1 ? channelData[1]! : left;

  const length = left.length;
  const chunkSize = Math.ceil(length / 100);
  const peaks: number[] = [];

  for (let i = 0; i < 100; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, length);
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += (Math.abs(left[j]!) + Math.abs(right[j]!)) / 2;
    }
    peaks.push(sum / (end - start));
  }

  let max = 0;
  for (const p of peaks) {
    if (p > max) max = p;
  }

  return { max, peaks };
}
