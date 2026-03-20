import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

interface Props {
  src: string;
}

export const SoundWaveSVG = ({ src }: Props) => {
  const uniqueIdRef = useRef(Math.random().toString(16));
  const [{ max, peaks }, setPeaks] = useState<ParsedData>({
    max: 0,
    peaks: [],
  });

  useEffect(() => {
    const worker = new Worker(new URL("../../workers/sound_wave_worker.ts", import.meta.url));
    worker.onmessage = ({ data }: MessageEvent<{ type: string; peaks: number[]; max: number }>) => {
      if (data.type === "peaks") {
        setPeaks({ max: data.max, peaks: data.peaks });
      }
    };

    (async () => {
      const res = await fetch(src);
      const buffer = await res.arrayBuffer();
      const audioCtx = new AudioContext();
      const audioBuffer = await audioCtx.decodeAudioData(buffer);

      const left = new Float32Array(audioBuffer.getChannelData(0));
      const right = new Float32Array(audioBuffer.getChannelData(1));
      worker.postMessage({ type: "process", left: left.buffer, right: right.buffer }, [
        left.buffer,
        right.buffer,
      ]);
    })();

    return () => worker.terminate();
  }, [src]);

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
