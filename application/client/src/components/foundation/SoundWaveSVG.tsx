import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

let sharedAudioContext: AudioContext | null = null;

function getAudioContext() {
  if (sharedAudioContext == null) {
    sharedAudioContext = new AudioContext();
  }
  return sharedAudioContext;
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = getAudioContext();

  // 音声をデコードする
  const buffer = await audioCtx.decodeAudioData(data.slice(0));
  const leftChannel = buffer.getChannelData(0);
  const rightChannel = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : leftChannel;
  const numPeaks = 100;
  const chunkSize = Math.max(1, Math.floor(buffer.length / numPeaks));
  const peaks = new Array<number>(numPeaks).fill(0);
  let max = 0;

  for (let peakIndex = 0; peakIndex < numPeaks; peakIndex += 1) {
    const start = peakIndex * chunkSize;
    const end = Math.min(start + chunkSize, buffer.length);
    let total = 0;

    for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
      const left = leftChannel[sampleIndex] ?? 0;
      const right = rightChannel[sampleIndex] ?? 0;
      total += (Math.abs(left) + Math.abs(right)) / 2;
    }

    const average = total / Math.max(1, end - start);
    peaks[peakIndex] = average;
    if (average > max) {
      max = average;
    }
  }

  return { max, peaks };
}

interface Props {
  soundData: ArrayBuffer;
}

const PLACEHOLDER_PEAKS = [0.2, 0.35, 0.55, 0.7, 0.5, 0.3, 0.18, 0.28, 0.48, 0.62, 0.42, 0.24];

export const SoundWaveSVG = ({ soundData }: Props) => {
  const uniqueIdRef = useRef(Math.random().toString(16));
  const [{ max, peaks }, setPeaks] = useState<ParsedData>({
    max: 0,
    peaks: [],
  });

  useEffect(() => {
    let isCancelled = false;
    const timeoutId = window.setTimeout(() => {
      void calculate(soundData).then((result) => {
        if (!isCancelled) {
          setPeaks(result);
        }
      });
    }, 250);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [soundData]);

  const visiblePeaks = peaks.length > 0 ? peaks : PLACEHOLDER_PEAKS;
  const visibleMax = max > 0 ? max : 1;

  return (
    <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 1">
      {visiblePeaks.map((peak, idx) => {
        const ratio = visibleMax > 0 ? peak / visibleMax : 0;
        const width = 100 / visiblePeaks.length;
        return (
          <rect
            key={`${uniqueIdRef.current}#${idx}`}
            fill="var(--color-cax-accent)"
            height={ratio}
            width={width}
            x={idx * width}
            y={1 - ratio}
          />
        );
      })}
    </svg>
  );
};
