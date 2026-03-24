interface WorkerInput {
  soundData: ArrayBuffer;
}

interface WorkerInputLegacy {
  leftData: Float32Array;
  rightData: Float32Array;
}

interface WorkerOutput {
  max: number;
  peaks: number[];
}

function computePeaks(leftData: Float32Array, rightData: Float32Array): WorkerOutput {
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
  return { max, peaks };
}

self.onmessage = async (e: MessageEvent<WorkerInput | WorkerInputLegacy>) => {
  const data = e.data;

  if ("soundData" in data) {
    const ctx = new OfflineAudioContext(1, 1, 44100);
    const buffer = await ctx.decodeAudioData(data.soundData);

    const leftData = buffer.getChannelData(0);
    const rightData = buffer.getChannelData(buffer.numberOfChannels > 1 ? 1 : 0);

    self.postMessage(computePeaks(leftData, rightData));
  } else {
    self.postMessage(computePeaks(data.leftData, data.rightData));
  }
};
