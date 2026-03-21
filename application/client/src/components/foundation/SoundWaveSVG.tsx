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

    const AudioContextClass = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    audioCtx.decodeAudioData(soundData.slice(0)).then((buffer) => {
      if (cancelled) return;

      const leftData = buffer.getChannelData(0);
      const rightData = buffer.getChannelData(buffer.numberOfChannels > 1 ? 1 : 0);

      const worker = new Worker(new URL("./sound_wave_worker", import.meta.url));
      worker.onmessage = (e: MessageEvent<ParsedData>) => {
        if (!cancelled) {
          setPeaks(e.data);
        }
        worker.terminate();
      };

      const leftCopy = leftData.slice(0);
      const rightCopy = rightData.slice(0);
      worker.postMessage({ leftData: leftCopy, rightData: rightCopy }, [
        leftCopy.buffer,
        rightCopy.buffer,
      ]);
    });

    return () => {
      cancelled = true;
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
