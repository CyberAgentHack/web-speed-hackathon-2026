import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

function mean(arr: (number | undefined)[]): number {
  let sum = 0;
  let count = 0;
  for (const v of arr) {
    if (v != null) { sum += v; count++; }
  }
  return count > 0 ? sum / count : 0;
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = new AudioContext();

  // 音声をデコードする
  const buffer = await audioCtx.decodeAudioData(data.slice(0));
  // 左の音声データの絶対値を取る
  const leftData = buffer.getChannelData(0);
  // 右の音声データの絶対値を取る
  const rightData = buffer.getChannelData(1);

  // 左右の音声データの平均を取る
  const normalized = Array.from(leftData, (v, i) => (Math.abs(v) + Math.abs(rightData[i]!)) / 2);
  // 100 個の chunk に分ける
  const chunkSize = Math.ceil(normalized.length / 100);
  const peaks: number[] = [];
  for (let i = 0; i < normalized.length; i += chunkSize) {
    peaks.push(mean(normalized.slice(i, i + chunkSize)));
  }
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
