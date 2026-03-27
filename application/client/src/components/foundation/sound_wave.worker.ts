interface ParsedData {
  max: number;
  peaks: number[];
}

interface WorkerRequest {
  requestId: number;
  soundData: ArrayBuffer;
}

type DecodingAudioContext = {
  decodeAudioData(audioData: ArrayBuffer): Promise<AudioBuffer>;
  close(): Promise<void>;
};

async function createAudioContext(): Promise<DecodingAudioContext> {
  const workerSelf = self as typeof globalThis & {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const NativeAudioContext = workerSelf.AudioContext ?? workerSelf.webkitAudioContext;
  if (NativeAudioContext != null) {
    return new NativeAudioContext();
  }

  const { AudioContext: StandardizedAudioContext } = await import("standardized-audio-context");
  return new StandardizedAudioContext();
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = await createAudioContext();

  try {
    // 音声をデコードする
    const buffer = await audioCtx.decodeAudioData(data.slice(0));
    // 左の音声データの絶対値を取る
    const leftData = Array.from(buffer.getChannelData(0), Math.abs);
    // 右の音声データの絶対値を取る
    const rightData = Array.from(buffer.getChannelData(1), Math.abs);

    // 左右の音声データの平均を取る
    const normalized = leftData.map((left, index) => {
      const right = rightData[index] ?? 0;
      return (left + right) / 2;
    });
    // 100 個の chunk に分ける
    const chunkSize = Math.ceil(normalized.length / 100);
    const chunks: number[][] = [];
    for (let i = 0; i < normalized.length; i += chunkSize) {
      chunks.push(normalized.slice(i, i + chunkSize));
    }
    // chunk ごとに平均を取る
    const peaks = chunks.map((chunk) => {
      const sum = chunk.reduce((acc, value) => acc + value, 0);
      return chunk.length === 0 ? 0 : sum / chunk.length;
    });
    // chunk の平均の中から最大値を取る
    const max = peaks.reduce((acc, value) => (value > acc ? value : acc), 0);

    return { max, peaks };
  } finally {
    await audioCtx.close();
  }
}

self.addEventListener("message", (ev: MessageEvent<WorkerRequest>) => {
  const { requestId, soundData } = ev.data;
  void calculate(soundData)
    .then((data) => {
      self.postMessage({ requestId, data });
    })
    .catch(() => {
      self.postMessage({
        requestId,
        data: {
          max: 0,
          peaks: [],
        } satisfies ParsedData,
      });
    });
});
