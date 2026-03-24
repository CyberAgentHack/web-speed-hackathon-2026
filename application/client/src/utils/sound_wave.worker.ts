interface SoundWaveRequest {
  id: number;
  leftData: Float32Array;
  rightData: Float32Array;
}

interface SoundWaveResponse {
  id: number;
  max: number;
  peaks: number[];
}

self.addEventListener("message", (ev: MessageEvent<SoundWaveRequest>) => {
  const { id, leftData, rightData } = ev.data;
  const n = leftData.length;
  const chunkSize = Math.ceil(n / 100);
  const peaks: number[] = new Array(100);

  for (let i = 0; i < 100; i++) {
    let sum = 0;
    let count = 0;
    const end = Math.min((i + 1) * chunkSize, n);
    for (let j = i * chunkSize; j < end; j++) {
      sum += (Math.abs(leftData[j]!) + Math.abs(rightData[j]!)) / 2;
      count++;
    }
    peaks[i] = count > 0 ? sum / count : 0;
  }

  const max = Math.max(...peaks);
  (self as unknown as Worker).postMessage({ id, max, peaks } as SoundWaveResponse);
});
