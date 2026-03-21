import { useEffect, useRef, useState } from "react";

import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface PeaksData {
  max: number;
  peaks: number[];
}

interface Props {
  soundId: string;
}

export const SoundWaveSVG = ({ soundId }: Props) => {
  const uniqueIdRef = useRef(Math.random().toString(16));
  const [data, setData] = useState<PeaksData | null>(null);

  useEffect(() => {
    fetchJSON<PeaksData>(`/api/v1/sounds/${soundId}/peaks`).then(setData).catch(() => {});
  }, [soundId]);

  if (data === null) {
    return <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 1" />;
  }

  const { max, peaks } = data;

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
