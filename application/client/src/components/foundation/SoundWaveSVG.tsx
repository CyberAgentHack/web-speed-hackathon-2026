import { useRef } from "react";

interface Props {
  peaks: number[];
}

export const SoundWaveSVG = ({ peaks }: Props) => {
  const uniqueIdRef = useRef(Math.random().toString(16));
  const maxVal = Math.max(...peaks);

  return (
    <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 1">
      {peaks.map((peak, idx) => {
        const ratio = maxVal > 0 ? peak / maxVal : 0;
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
