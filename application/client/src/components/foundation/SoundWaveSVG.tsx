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
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const [{ max, peaks }, setPeaks] = useState<ParsedData>({
    max: 0,
    peaks: [],
  });

  useEffect(() => {
    const worker = new Worker(
      new URL("./sound_wave.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (workerRef.current === null) {
      return;
    }
    setPeaks({ max: 0, peaks: [] });

    const worker = workerRef.current;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const handleMessage = (ev: MessageEvent<{ requestId: number; data: ParsedData }>) => {
      if (ev.data.requestId === requestId) {
        setPeaks(ev.data.data);
      }
    };
    worker.addEventListener("message", handleMessage);

    const transferableData = soundData.slice(0);
    worker.postMessage({ requestId, soundData: transferableData }, [transferableData]);
    return () => {
      worker.removeEventListener("message", handleMessage);
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
