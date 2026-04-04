import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

const PEAK_COUNT = 100;

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (sharedAudioContext === null) {
    sharedAudioContext = new AudioContext();
  }

  return sharedAudioContext;
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = getAudioContext();

  // 音声をデコードする
  const buffer = await audioCtx.decodeAudioData(data.slice(0));

  const leftData = buffer.getChannelData(0);
  const rightData = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : leftData;

  const sums = new Array<number>(PEAK_COUNT).fill(0);
  const counts = new Array<number>(PEAK_COUNT).fill(0);

  for (let index = 0; index < leftData.length; index += 1) {
    const peakIndex = Math.min(PEAK_COUNT - 1, Math.floor((index * PEAK_COUNT) / leftData.length));
    const mixedAmplitude = (Math.abs(leftData[index] ?? 0) + Math.abs(rightData[index] ?? 0)) / 2;

    sums[peakIndex] = (sums[peakIndex] ?? 0) + mixedAmplitude;
    counts[peakIndex] = (counts[peakIndex] ?? 0) + 1;
  }

  let max = 0;
  const peaks = sums.map((sum, index) => {
    const count = counts[index] ?? 0;
    const peak = count === 0 ? 0 : sum / count;
    if (peak > max) {
      max = peak;
    }
    return peak;
  });

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
    let cancelled = false;

    calculate(soundData).then(({ max, peaks }) => {
      if (!cancelled) {
        setPeaks({ max, peaks });
      }
    });

    return () => {
      cancelled = true;
    };
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
