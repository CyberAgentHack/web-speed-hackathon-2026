import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

type IdleTaskId = number | ReturnType<typeof globalThis.setTimeout>;

function scheduleIdleTask(callback: () => void): IdleTaskId {
  const browserGlobals = globalThis as typeof globalThis & {
    requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
    cancelIdleCallback?: (idleId: number) => void;
  };

  if (typeof browserGlobals.requestIdleCallback === "function") {
    return browserGlobals.requestIdleCallback(callback, { timeout: 2000 });
  }

  return globalThis.setTimeout(callback, 0);
}

function cancelIdleTask(id: IdleTaskId) {
  const browserGlobals = globalThis as typeof globalThis & {
    requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
    cancelIdleCallback?: (idleId: number) => void;
  };

  if (typeof browserGlobals.cancelIdleCallback === "function") {
    browserGlobals.cancelIdleCallback(id as number);
    return;
  }

  globalThis.clearTimeout(id);
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = new AudioContext();

  // const mean = (values: number[]): number => {
  //   if (values.length === 0) return 0;
  //   return values.reduce((sum, value) => sum + value, 0) / values.length;
  // };

  // // 音声をデコードする
  // const buffer = await audioCtx.decodeAudioData(data.slice(0));
  // // 左の音声データの絶対値を取る
  // const leftData = Array.from(buffer.getChannelData(0), Math.abs);
  // // 右の音声データの絶対値を取る
  // const rightData = Array.from(buffer.getChannelData(1), Math.abs);

  // // 左右の音声データの平均を取る
  // const normalized = leftData.map((left, idx) => mean([left, rightData[idx] ?? 0]));
  // // 100 個の chunk に分ける
  // const chunkSize = Math.max(1, Math.ceil(normalized.length / 100));
  // const chunks: number[][] = [];
  // for (let idx = 0; idx < normalized.length; idx += chunkSize) {
  //   chunks.push(normalized.slice(idx, idx + chunkSize));
  // }
  // // chunk ごとに平均を取る
  // const peaks = chunks.map((chunk) => mean(chunk));
  // // chunk の平均の中から最大値を取る
  // const max = peaks.length > 0 ? Math.max(...peaks) : 0;

  try {
    // デコード
    const buffer = await audioCtx.decodeAudioData(data.slice(0));
    const chunkSize = Math.max(1, Math.ceil(buffer.length / 100));
    const peaks: number[] = [];
    const channel1 = buffer.getChannelData(0);
    const channel2 = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : null;
    let max = 0;
    for (let idx = 0; idx < buffer.length; idx += chunkSize) {
      let sum = 0;
      let count = 0;
      for (let i = 0; i < chunkSize && idx + i < buffer.length; i++) {
        sum += Math.abs(channel1[idx + i] ?? 0);
        count += 1;
        if (channel2 !== null) {
          sum += Math.abs(channel2[idx + i] ?? 0);
          count += 1;
        }
      }
      const peak = count > 0 ? sum / count : 0;
      peaks.push(peak);
      if (peak > max) {
        max = peak;
      }
    }

    return { max, peaks };
  } finally {
    await audioCtx.close();
  }  
}

interface Props {
  soundData: ArrayBuffer;
}

export const SoundWaveSVG = ({ soundData }: Props) => {
  const uniqueIdRef = useRef(Math.random().toString(16));
  const [{ max, peaks }, setPeaks] = useState<ParsedData>({
    max: 0,
    peaks: [],
  });

  useEffect(() => {
    let isDisposed = false;
    const idleTaskId = scheduleIdleTask(() => {
      calculate(soundData).then(({ max, peaks }) => {
        if (!isDisposed) {
          setPeaks({ max, peaks });
        }
      });
    });

    return () => {
      isDisposed = true;
      cancelIdleTask(idleTaskId);
    };
  }, [soundData]);

  return (
    <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 1">
      {peaks.map((peak, idx) => {
        const ratio = peak / max;
        return (
          <rect
            key={`${uniqueIdRef.current}#${idx}`}
            fill="var(--color-cax-accent)"
            height={ratio}
            width="1"
            x={idx}
            y={1 - ratio}
          />
        );
      })}
    </svg>
  );
};
