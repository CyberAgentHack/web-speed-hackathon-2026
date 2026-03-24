import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

interface Props {
  soundData: ArrayBuffer;
}

export const SoundWaveSVG = ({ soundData }: Props) => {
  const uniqueIdRef = useRef(Math.random().toString(16));
  const [{ max, peaks }, setPeaks] = useState<ParsedData>({
    max: 0,
    peaks: [],
  });

  useEffect(() => {
    let cancelled = false;

    const worker = new Worker(new URL("./sound_wave_worker", import.meta.url));
    worker.onmessage = (e: MessageEvent<ParsedData>) => {
      if (!cancelled) {
        setPeaks(e.data);
      }
      worker.terminate();
    };

    const copy = soundData.slice(0);
    worker.postMessage({ soundData: copy }, [copy]);

    return () => {
      cancelled = true;
      worker.terminate();
    };
  }, [soundData]);

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
