interface WorkerInput {
  left: Float32Array;
  right: Float32Array;
}

interface WorkerOutput {
  max: number;
  peaks: number[];
}

// Float32Array を受け取ってピーク値を計算して返すワーカー
// decodeAudioData はメインスレッドで実行済み
self.addEventListener("message", (e: MessageEvent<WorkerInput>) => {
  const { left, right } = e.data;
  const len = left.length;
  const chunkSize = Math.ceil(len / 100);

  const peaks: number[] = [];
  for (let i = 0; i < len; i += chunkSize) {
    let sum = 0;
    const end = Math.min(i + chunkSize, len);
    for (let j = i; j < end; j++) {
      sum += (Math.abs(left[j]!) + Math.abs(right[j] ?? 0)) / 2;
    }
    peaks.push(sum / (end - i));
  }

  const max = peaks.length > 0 ? Math.max(...peaks) : 0;
  (self as unknown as Worker).postMessage({ max, peaks } satisfies WorkerOutput);
});
