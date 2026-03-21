import { memo, useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = new AudioContext();
  const buffer = await audioCtx.decodeAudioData(data.slice(0));
  void audioCtx.close();

  // Float32Array を直接使用（Array.from によるコピーを避ける）
  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;
  const total = left.length;
  const chunkSize = Math.ceil(total / 100);

  const peaks: number[] = [];
  for (let i = 0; i < 100; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, total);
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += (Math.abs(left[j]!) + Math.abs(right[j]!)) / 2;
    }
    peaks.push(sum / (end - start));
  }

  const max = peaks.reduce((a, b) => Math.max(a, b), 0);
  return { max, peaks };
}

interface Props {
  soundData: ArrayBuffer;
}

export const SoundWaveSVG = memo(({ soundData }: Props) => {
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
});

SoundWaveSVG.displayName = "SoundWaveSVG";
