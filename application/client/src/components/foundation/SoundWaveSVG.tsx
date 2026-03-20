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
  const leftData = buffer.getChannelData(0);
  // 右の音声データの絶対値を取る
  const rightData = buffer.getChannelData(1);

  // 左右の音声データの平均の絶対値を取り、chunkに分けて平均を取る
  const chunkSize = Math.ceil(leftData.length / 100);
  const numChunks = Math.ceil(leftData.length / chunkSize);
  const peaks: number[] = [];
  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, leftData.length);
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += (Math.abs(leftData[j]!) + Math.abs(rightData[j]!)) / 2;
    }
    peaks.push(sum / (end - start));
  }

  // chunk の平均の中から最大値を取る
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
