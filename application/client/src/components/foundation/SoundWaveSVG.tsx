import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = new AudioContext();

  const buffer = await audioCtx.decodeAudioData(data.slice(0));
  const leftData = buffer.getChannelData(0);
  const rightData = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : null;

  const length = leftData.length;
  const chunkSize = Math.ceil(length / 100);
  const peaks: number[] = [];

  for (let i = 0; i < length; i += chunkSize) {
    let sum = 0;
    const end = Math.min(i + chunkSize, length);
    for (let j = i; j < end; j++) {
      sum += rightData !== null ? (Math.abs(leftData[j]!) + Math.abs(rightData[j]!)) / 2 : Math.abs(leftData[j]!);
    }
    peaks.push(sum / (end - i));
    await yieldToMain();
  }

  let max = 0;
  for (const p of peaks) {
    if (p > max) max = p;
  }

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
