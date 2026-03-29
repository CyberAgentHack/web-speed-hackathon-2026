type WorkerRequest = {
  leftChannel: ArrayBuffer;
  requestId: number;
  rightChannel?: ArrayBuffer;
};

type WorkerResponse = {
  max: number;
  peaks: number[];
  requestId: number;
};

const WAVEFORM_BAR_COUNT = 100;

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function chunk(values: number[], chunkSize: number): number[][] {
  const chunks: number[][] = [];
  for (let start = 0; start < values.length; start += chunkSize) {
    chunks.push(values.slice(start, start + chunkSize));
  }

  return chunks;
}

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  const leftChannel = new Float32Array(event.data.leftChannel);
  const rightChannel = event.data.rightChannel
    ? new Float32Array(event.data.rightChannel)
    : leftChannel;
  const normalized = Array.from({ length: leftChannel.length }, (_, index) => {
    const left = Math.abs(leftChannel[index] ?? 0);
    const right = Math.abs(rightChannel[index] ?? 0);
    return mean([left, right]);
  });
  const chunkSize = Math.max(1, Math.ceil(normalized.length / WAVEFORM_BAR_COUNT));
  const peaks = chunk(normalized, chunkSize)
    .slice(0, WAVEFORM_BAR_COUNT)
    .map((values) => mean(values));
  const max = Math.max(...peaks, 0);

  while (peaks.length < WAVEFORM_BAR_COUNT) {
    peaks.push(0);
  }

  const response: WorkerResponse = {
    max,
    peaks,
    requestId: event.data.requestId,
  };

  self.postMessage(response);
});
