import { useEffect, useMemo, useState } from "react";

import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  soundId: string;
}

export const SoundWaveSVG = ({ soundId }: Props) => {
  const [peaks, setPeaks] = useState<number[]>([]);

  useEffect(() => {
    fetchJSON<{ peaks: number[] }>(`/api/v1/waveform/${soundId}`)
      .then(({ peaks }) => {
        setPeaks(peaks);
      })
      .catch(() => {
        // Waveform not available yet
      });
  }, [soundId]);

  const pathD = useMemo(() => {
    if (peaks.length === 0) return "";
    return peaks.map((ratio, i) => `M${i},${1 - ratio}v${ratio}`).join("");
  }, [peaks]);

  if (peaks.length === 0) return null;

  return (
    <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 1">
      <path d={pathD} stroke="var(--color-cax-accent)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};
