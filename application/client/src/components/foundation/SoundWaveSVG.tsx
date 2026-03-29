import { useRef } from "react";

const FALLBACK_PEAKS = Array.from({ length: 100 }, (_, idx) =>
  idx % 7 === 0 ? 0.75 : idx % 5 === 0 ? 0.55 : 0.35,
);

interface Props {
  max?: number;
  peaks?: number[];
}

export const SoundWaveSVG = ({ max = 1, peaks = FALLBACK_PEAKS }: Props) => {
  const uniqueIdRef = useRef(Math.random().toString(16));

  return (
    <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 1">
      {peaks.map((peak, idx) => {
        const ratio = max > 0 ? peak / max : 0;
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
