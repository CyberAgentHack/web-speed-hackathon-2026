import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = new AudioContext();

  // 音声をデコードする
  const buffer = await audioCtx.decodeAudioData(data.slice(0));
  // 左右の音声データの絶対値の平均を取る
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const len = left.length;

  const normalized = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    normalized[i] = (Math.abs(left[i]!) + Math.abs(right[i]!)) / 2;
  }

  // 100 個の chunk に分ける
  const chunkSize = Math.ceil(len / 100);
  const peaks: number[] = [];
  for (let i = 0; i < 100; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, len);
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += normalized[j]!;
    }
    peaks.push(sum / (end - start));
  }

  const max = Math.max(...peaks);
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
