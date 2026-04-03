import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = new AudioContext();

  try {
    // 音声をデコードする
    const buffer = await audioCtx.decodeAudioData(data.slice(0));

    const leftData = buffer.getChannelData(0);
    const rightData = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : leftData;

    const sampleCount = leftData.length;
    const chunkSize = Math.max(1, Math.ceil(sampleCount / 100));
    const peaks: number[] = [];

    for (let i = 0; i < sampleCount; i += chunkSize) {
      const end = Math.min(sampleCount, i + chunkSize);
      let sum = 0;

      for (let j = i; j < end; j += 1) {
        const left = Math.abs(leftData[j] ?? 0);
        const right = Math.abs(rightData[j] ?? 0);
        sum += (left + right) / 2;
      }

      peaks.push(sum / (end - i));
    }

    const max = peaks.reduce((cur, value) => (value > cur ? value : cur), 0);

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
