import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = new AudioContext();

  // 音声をデコードする
  const buffer = await audioCtx.decodeAudioData(data.slice(0));
  // 左の音声データの絶対値を取る
  const leftData = Array.from(buffer.getChannelData(0), Math.abs);
  // 右の音声データの絶対値を取る
  const rightData = Array.from(buffer.getChannelData(1), Math.abs);

  // 左右の音声データの平均を取る
  const normalized = leftData.map((l, i) => (l + (rightData[i] ?? 0)) / 2);
  // 100 個の chunk に分ける
  const chunkSize = Math.ceil(normalized.length / 100);
  const peaks: number[] = [];
  for (let i = 0; i < normalized.length; i += chunkSize) {
    const chunk = normalized.slice(i, i + chunkSize);
    const mean = chunk.reduce((sum, v) => sum + v, 0) / chunk.length;
    peaks.push(mean);
  }
  // chunk の平均の中から最大値を取る
  const max = Math.max(...peaks, 0);

  return { max, peaks };
}

interface Props {
  soundUrl: string;
}

export const SoundWaveSVG = ({ soundUrl }: Props) => {
  const uniqueIdRef = useRef(Math.random().toString(16));
  const [{ max, peaks }, setPeaks] = useState<ParsedData>({
    max: 0,
    peaks: [],
  });

  useEffect(() => {
    fetch(soundUrl)
      .then((res) => res.arrayBuffer())
      .then((data) => calculate(data))
      .then(({ max, peaks }) => {
        setPeaks({ max, peaks });
      });
  }, [soundUrl]);

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
