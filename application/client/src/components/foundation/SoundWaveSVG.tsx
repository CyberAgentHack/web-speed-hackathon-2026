import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

const NUM_PEAKS = 100;

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = new AudioContext();
  try {
    const buffer = await audioCtx.decodeAudioData(data.slice(0));
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    const len = left.length;
    const chunkSize = Math.ceil(len / NUM_PEAKS);
    const peaks: number[] = new Array(NUM_PEAKS);
    let max = 0;

    for (let i = 0; i < NUM_PEAKS; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, len);
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += (Math.abs(left[j]!) + Math.abs(right[j]!)) / 2;
      }
      const avg = sum / (end - start);
      peaks[i] = avg;
      if (avg > max) max = avg;
    }

    return { max, peaks };
  } finally {
    void audioCtx.close();
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
