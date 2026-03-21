import { useRef } from "react";

interface Props {
  max: number;
  peaks: number[];
}

export const SoundWaveSVG = ({ peaks, max }: Props) => {
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
