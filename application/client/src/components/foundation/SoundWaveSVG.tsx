import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = new AudioContext();

  // 音声をデコードする
  const buffer = await audioCtx.decodeAudioData(data.slice(0));
  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels >= 2 ? buffer.getChannelData(1) : left;
  const sampleLength = Math.min(left.length, right.length);
  const chunkSize = Math.max(1, Math.ceil(sampleLength / 100));
  const peaks: number[] = [];

  for (let i = 0; i < sampleLength; i += chunkSize) {
    const end = Math.min(i + chunkSize, sampleLength);
    let sum = 0;
    for (let j = i; j < end; j += 1) {
      sum += (Math.abs(left[j] ?? 0) + Math.abs(right[j] ?? 0)) / 2;
    }
    peaks.push(end > i ? sum / (end - i) : 0);
  }

  const max = peaks.reduce((acc, value) => (value > acc ? value : acc), 0);

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
