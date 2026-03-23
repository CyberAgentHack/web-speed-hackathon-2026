import { useMemo, useRef } from "react";

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

interface Props {
  seed: string;
}

export const SoundWaveSVG = ({ seed }: Props) => {
  const uniqueIdRef = useRef(Math.random().toString(16));
  const peaks = useMemo(() => {
    const values: number[] = [];
    let current = hashSeed(seed);
    for (let idx = 0; idx < 100; idx++) {
      current = Math.imul(current, 1664525) + 1013904223;
      const normalized = ((current >>> 0) % 1000) / 1000;
      const envelope = 0.45 + 0.55 * Math.sin(((idx + 1) / 101) * Math.PI);
      values.push(Math.max(0.08, normalized * envelope));
    }
    return values;
  }, [seed]);

  return (
    <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 1">
      {peaks.map((peak, idx) => {
        return (
          <rect
            key={`${uniqueIdRef.current}#${idx}`}
            fill="var(--color-cax-accent)"
            height={peak}
            width="1"
            x={idx}
            y={1 - peak}
          />
        );
      })}
    </svg>
  );
};
