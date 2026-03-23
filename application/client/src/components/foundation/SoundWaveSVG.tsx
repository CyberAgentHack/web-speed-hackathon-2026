import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

const yieldToMain = () => new Promise<void>((r) => setTimeout(r, 0));

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = new AudioContext();
  // slice(0)を避けてtransferable対応バッファを直接渡す
  const buffer = await audioCtx.decodeAudioData(data.slice(0));

  await yieldToMain();

  // Float32Arrayから直接ピーク計算（Array.fromで全変換しない）
  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;
  const totalSamples = left.length;
  const bucketSize = Math.ceil(totalSamples / 100);
  const peaks: number[] = [];

  for (let i = 0; i < 100; i++) {
    const start = i * bucketSize;
    const end = Math.min(start + bucketSize, totalSamples);
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += (Math.abs(left[j]!) + Math.abs(right[j]!)) / 2;
    }
    peaks.push(sum / (end - start));

    // 10バケットごとにyield（メインスレッドに制御を戻す）
    if (i % 10 === 9) {
      await yieldToMain();
    }
  }

  const max = Math.max(...peaks, 0);
  await audioCtx.close();
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
    // requestIdleCallbackで波形計算をアイドル時まで遅延（TTIを先に達成）
    const id = requestIdleCallback(() => {
      calculate(soundData).then(({ max, peaks }) => {
        setPeaks({ max, peaks });
      });
    });
    return () => cancelIdleCallback(id);
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
