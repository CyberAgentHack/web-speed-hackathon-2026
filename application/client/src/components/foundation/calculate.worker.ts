interface CalculateMessage {
  left: Float32Array;
  right: Float32Array | null;
}

interface CalculateResult {
  max: number;
  peaks: number[];
}

self.onmessage = (event: MessageEvent<CalculateMessage>) => {
  const { left, right } = event.data;

  // 左右の音声データの平均を取る
  const normalized = left.map((l, i) => (l + (right?.[i] ?? 0)) / 2);

  // 100 個の chunk に分ける
  const chunkSize = Math.ceil(normalized.length / 100);
  const chunks: number[][] = [];
  for (let i = 0; i < normalized.length; i += chunkSize) {
    chunks.push(Array.from(normalized.slice(i, i + chunkSize)));
  }

  // chunk ごとに平均を取る
  const peaks = chunks.map((chunk) =>
    chunk.reduce((sum, v) => sum + v, 0) / chunk.length
  );

  // chunk の平均の中から最大値を取る
  const max = peaks.length > 0 ? Math.max(...peaks) : 0;

  const result: CalculateResult = { max, peaks };
  self.postMessage(result);
};
