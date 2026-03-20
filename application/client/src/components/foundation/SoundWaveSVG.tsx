import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

function zip<T, U, V>(
  a: Iterable<T>,
  b: Iterable<U>,
  fn: (a: T, b: U) => V,
): V[] {
  const result: V[] = [];
  const aIter = a[Symbol.iterator]();
  const bIter = b[Symbol.iterator]();
  while (true) {
    const aNext = aIter.next();
    const bNext = bIter.next();
    if (aNext.done || bNext.done) {
      break;
    }
    result.push(fn(aNext.value, bNext.value));
  }
  return result;
}

function chunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = new AudioContext();

  // 音声をデコードする
  const buffer = await audioCtx.decodeAudioData(data.slice(0));
  // 左の音声データの絶対値を取る
  const leftData = buffer.getChannelData(0).map((value) => Math.abs(value));
  // 右の音声データの絶対値を取る
  const rightData = buffer.getChannelData(1).map((value) => Math.abs(value));

  // 左右の音声データの平均を取る
  const normalized = zip(leftData, rightData, (a, b) => (a + b) / 2);
  // 100 個の chunk に分ける
  const chunks = chunk(normalized, Math.ceil(normalized.length / 100));
  // chunk ごとに平均を取る
  const peaks = chunks.map(
    (chunk) => chunk.reduce((sum, value) => sum + value, 0) / chunk.length,
  );
  // chunk の平均の中から最大値を取る
  const max = Math.max(...peaks, 0);

  return { max, peaks };
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
    calculate(soundData).then(({ max, peaks }) => {
      setPeaks({ max, peaks });
    });
  }, [soundData]);

  return (
    <svg
      className="h-full w-full"
      preserveAspectRatio="none"
      viewBox="0 0 100 1"
    >
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
