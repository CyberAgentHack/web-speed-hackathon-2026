import { useEffect, useMemo, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

const PEAK_COUNT = 100;

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (sharedAudioContext == null) {
    sharedAudioContext = new AudioContext();
  }

  return sharedAudioContext;
}

const parsedCache = new WeakMap<ArrayBuffer, ParsedData>();

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const cached = parsedCache.get(data);
  if (cached != null) {
    return cached;
  }

  const audioCtx = getAudioContext();

  // decodeAudioData は元の buffer を消費することがあるため copy を渡す
  const buffer = await audioCtx.decodeAudioData(data.slice(0));

  const channelCount = buffer.numberOfChannels;
  const left = buffer.getChannelData(0);
  const right = channelCount > 1 ? buffer.getChannelData(1) : left;

  const sampleLength = Math.min(left.length, right.length);
  const chunkSize = Math.max(1, Math.ceil(sampleLength / PEAK_COUNT));
  const peaks = new Array<number>(PEAK_COUNT).fill(0);

  let max = 0;

  for (let i = 0; i < PEAK_COUNT; i += 1) {
    const start = i * chunkSize;
    const end = Math.min(sampleLength, start + chunkSize);

    if (start >= sampleLength) {
      peaks[i] = 0;
      continue;
    }

    let sum = 0;
    let count = 0;

    for (let j = start; j < end; j += 1) {
      const value = (Math.abs(left[j] ?? 0) + Math.abs(right[j] ?? 0)) / 2;
      sum += value;
      count += 1;
    }

    const peak = count > 0 ? sum / count : 0;
    peaks[i] = peak;

    if (peak > max) {
      max = peak;
    }
  }

  const parsed = { max, peaks };
  parsedCache.set(data, parsed);

  return parsed;
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
    let isCancelled = false;

    void calculate(soundData).then(({ max: nextMax, peaks: nextPeaks }) => {
      if (!isCancelled) {
        setPeaks({ max: nextMax, peaks: nextPeaks });
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [soundData]);

  const bars = useMemo(() => {
    if (max <= 0) {
      return null;
    }

    return peaks.map((peak, idx) => {
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
    });
  }, [max, peaks]);

  return (
    <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 1">
      {bars}
    </svg>
  );
};