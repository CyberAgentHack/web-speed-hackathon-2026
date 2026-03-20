import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = new AudioContext();

  const buffer = await audioCtx.decodeAudioData(data.slice(0));
  const leftData = buffer.getChannelData(0);
  const rightData = buffer.getChannelData(1);

  const len = leftData.length;
  const normalized = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    normalized[i] = (Math.abs(leftData[i]) + Math.abs(rightData[i])) / 2;
  }

  const chunkSize = Math.ceil(len / 100);
  const peaks: number[] = [];
  let max = 0;
  for (let i = 0; i < len; i += chunkSize) {
    const end = Math.min(i + chunkSize, len);
    let sum = 0;
    for (let j = i; j < end; j++) {
      sum += normalized[j];
    }
    const mean = sum / (end - i);
    peaks.push(mean);
    if (mean > max) max = mean;
  }

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
