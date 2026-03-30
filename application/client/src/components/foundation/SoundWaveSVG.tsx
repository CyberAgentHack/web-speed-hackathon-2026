import { useRef } from "react";

interface Props {
  soundWave: Models.SoundWavePoints;
}

export const SoundWaveSVG = ({ soundWave: { max, peaks } }: Props) => {
  const uniqueIdRef = useRef(Math.random().toString(16));

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
