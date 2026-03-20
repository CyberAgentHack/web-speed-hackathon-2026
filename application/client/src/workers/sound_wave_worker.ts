self.onmessage = (e: MessageEvent<{ type: string; left: ArrayBuffer; right: ArrayBuffer }>) => {
  if (e.data.type !== "process") return;

  // 左の音声データの絶対値を取る
  const left = new Float32Array(e.data.left);
  // 右の音声データの絶対値を取る
  const right = new Float32Array(e.data.right);
  const len = left.length;
  const chunkSize = Math.ceil(len / 100);

  // 左右の音声データの平均を取る / 100 個の chunk に分ける / chunk ごとに平均を取る
  const peaks: number[] = [];

  for (let i = 0; i < 100; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, len);
    if (start >= len) {
      peaks.push(0);
      continue;
    }
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += (Math.abs(left[j]!) + Math.abs(right[j]!)) / 2;
    }
    peaks.push(sum / (end - start));
  }

  // chunk の平均の中から最大値を取る
  const max = Math.max(...peaks);
  self.postMessage({ type: "peaks", max, peaks });
};
