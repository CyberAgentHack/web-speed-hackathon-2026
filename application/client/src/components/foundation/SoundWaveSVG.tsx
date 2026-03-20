import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = new AudioContext();

  // 音声をデコードする
  const buffer = await audioCtx.decodeAudioData(data.slice(0));
  const leftChannel = buffer.getChannelData(0);
  const rightChannel = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : leftChannel;

  const normalized = new Array<number>(leftChannel.length);
  for (let i = 0; i < leftChannel.length; i++) {
    normalized[i] = (Math.abs(leftChannel[i] ?? 0) + Math.abs(rightChannel[i] ?? 0)) / 2;
  }

  const chunkSize = Math.max(1, Math.ceil(normalized.length / 100));
  const peaks: number[] = [];
  for (let i = 0; i < normalized.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, normalized.length);
    let sum = 0;
    for (let j = i; j < end; j++) {
      sum += normalized[j] ?? 0;
    }
    peaks.push(sum / Math.max(1, end - i));
  }

  let max = 0;
  for (const peak of peaks) {
    if (peak > max) {
      max = peak;
    }
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
