import { useEffect, useRef, useState } from "react";

import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface ParsedData {
  max: number;
  peaks: number[];
}

interface Props {
  waveformSrc: string;
}

export const SoundWaveSVG = ({ waveformSrc }: Props) => {
  const uniqueIdRef = useRef(Math.random().toString(16));
  const [{ max, peaks }, setPeaks] = useState<ParsedData>({
    max: 0,
    peaks: [],
  });

  useEffect(() => {
    const idleWindow = window as Window & {
      cancelIdleCallback?: (id: number) => void;
      requestIdleCallback?: (callback: () => void) => number;
    };
    let isCancelled = false;
    let idleId: number | null = null;
    let timeoutId: number | null = null;

    const loadWaveform = () => {
      void fetchJSON<ParsedData>(waveformSrc)
        .then(({ max, peaks }) => {
          if (isCancelled) {
            return;
          }
          setPeaks({ max, peaks });
        })
        .catch(() => {
          // 波形取得の失敗でUI全体は落とさない
        });
    };

    if (idleWindow.requestIdleCallback) {
      idleId = idleWindow.requestIdleCallback(loadWaveform);
    } else {
      timeoutId = window.setTimeout(loadWaveform, 500);
    }

    return () => {
      isCancelled = true;
      if (idleId !== null) {
        idleWindow.cancelIdleCallback?.(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [waveformSrc]);

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
