import { useMemo, useRef } from "react";

function createPeaks(seedText: string, count: number): number[] {
  let seed = 0;
  for (const char of seedText) {
    seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  }

  const peaks: number[] = [];
  for (let i = 0; i < count; i += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const random = seed / 0xffffffff;
    const envelope = Math.sin((i / count) * Math.PI);
    peaks.push(0.1 + random * 0.7 + envelope * 0.2);
  }

  return peaks;
}

interface Props {
  seed: string;
}

export const SoundWaveSVG = ({ seed }: Props) => {
  const uniqueIdRef = useRef(Math.random().toString(16));
  const peaks = useMemo(() => createPeaks(seed, 100), [seed]);

  return (
    <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 1">
      {peaks.map((peak, idx) => {
        const ratio = peak;
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
