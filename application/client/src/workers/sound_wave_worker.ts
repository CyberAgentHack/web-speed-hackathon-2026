interface InputMessage {
  buffer: ArrayBuffer;
}

interface OutputMessage {
  max: number;
  peaks: number[];
}

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = async (event: MessageEvent<InputMessage>) => {
  const { buffer } = event.data;

  const audioCtx = new OfflineAudioContext(2, 1, 44100);
  const audioBuffer = await audioCtx.decodeAudioData(buffer);
  const leftData = audioBuffer.getChannelData(0);
  const rightData = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftData;

  const len = leftData.length;
  const chunkSize = Math.ceil(len / 100);
  const peaks: number[] = [];

  for (let i = 0; i < len; i += chunkSize) {
    let sum = 0;
    const end = Math.min(i + chunkSize, len);
    for (let j = i; j < end; j++) {
      sum += (Math.abs(leftData[j]!) + Math.abs(rightData[j]!)) / 2;
    }
    peaks.push(sum / (end - i));
  }

  let max = 0;
  for (const p of peaks) {
    if (p > max) max = p;
  }

  self.postMessage({ max, peaks } satisfies OutputMessage);
};
