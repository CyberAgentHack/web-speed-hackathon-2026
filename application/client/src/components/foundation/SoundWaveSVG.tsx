import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = new AudioContext();

  // 音声をデコードする
  const buffer = await audioCtx.decodeAudioData(data.slice(0));
  const leftData = buffer.getChannelData(0);
  const rightData = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : leftData;

  const normalized = new Array<number>(leftData.length);
  for (let index = 0; index < leftData.length; index += 1) {
    normalized[index] = (Math.abs(leftData[index] ?? 0) + Math.abs(rightData[index] ?? 0)) / 2;
  }

  const chunkSize = Math.max(1, Math.ceil(normalized.length / 100));
  const peaks: number[] = [];
  for (let start = 0; start < normalized.length; start += chunkSize) {
    let total = 0;
    let count = 0;
    for (let index = start; index < Math.min(start + chunkSize, normalized.length); index += 1) {
      total += normalized[index] ?? 0;
      count += 1;
    }
    peaks.push(count === 0 ? 0 : total / count);
  }

  const max = peaks.reduce((currentMax, peak) => Math.max(currentMax, peak), 0);

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
