import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

function mean(arr: (number | undefined)[]): number {
  let sum = 0;
  let count = 0;
  for (const v of arr) {
    if (v != null) {
      sum += v;
      count++;
    }
  }
  return count === 0 ? 0 : sum / count;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// メインスレッドに制御を戻す
const yieldToMain = () => new Promise<void>((r) => setTimeout(r, 0));

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = new AudioContext();
  const buffer = await audioCtx.decodeAudioData(data.slice(0));

  await yieldToMain();
  const leftData = Array.from(buffer.getChannelData(0), Math.abs);

  await yieldToMain();
  const rightData = Array.from(buffer.getChannelData(1), Math.abs);

  await yieldToMain();
  const normalized = leftData.map((v, i) => (v + (rightData[i] ?? 0)) / 2);
  const chunks = chunk(normalized, Math.ceil(normalized.length / 100));
  const peaks = chunks.map(mean);
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
