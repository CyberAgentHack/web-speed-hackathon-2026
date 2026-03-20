import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const AudioContextClass = window.AudioContext;
  if (AudioContextClass == null) {
    return { max: 0, peaks: [] };
  }

  const audioCtx = new AudioContextClass();

  try {
    const buffer = await audioCtx.decodeAudioData(data.slice(0));
    const leftData = buffer.getChannelData(0);
    const rightData = buffer.getChannelData(Math.min(1, buffer.numberOfChannels - 1));
    const chunkSize = Math.max(1, Math.ceil(leftData.length / 100));
    const peaks: number[] = [];
    let max = 0;

    for (let start = 0; start < leftData.length; start += chunkSize) {
      const end = Math.min(leftData.length, start + chunkSize);
      let sum = 0;

      for (let idx = start; idx < end; idx++) {
        const left = Math.abs(leftData[idx] ?? 0);
        const right = Math.abs(rightData[idx] ?? 0);
        sum += (left + right) / 2;
      }

      const peak = sum / Math.max(1, end - start);
      peaks.push(peak);
      max = Math.max(max, peak);
    }

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
