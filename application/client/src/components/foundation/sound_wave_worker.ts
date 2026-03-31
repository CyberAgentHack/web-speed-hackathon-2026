interface WorkerInput {
  leftData: Float32Array;
  rightData: Float32Array;
}

interface WorkerOutput {
  max: number;
  peaks: number[];
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { leftData, rightData } = e.data;

  const length = leftData.length;
  const chunkSize = Math.ceil(length / 100);
  const peaks: number[] = [];

  for (let i = 0; i < length; i += chunkSize) {
    const end = Math.min(i + chunkSize, length);
    let sum = 0;
    for (let j = i; j < end; j++) {
      sum += (Math.abs(leftData[j]!) + Math.abs(rightData[j]!)) / 2;
    }
    peaks.push(sum / (end - i));
  }

  const max = peaks.reduce((a, b) => Math.max(a, b), 0);
  const result: WorkerOutput = { max, peaks };
  self.postMessage(result);
};
