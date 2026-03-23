import { useEffect, useRef, useState } from "react";

interface WaveformData {
  max: number;
  peaks: number[];
}

interface Props {
  soundId: string;
}

export const SoundWaveSVG = ({ soundId }: Props) => {
  const uniqueIdRef = useRef(Math.random().toString(16));
  const [waveform, setWaveform] = useState<WaveformData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/waveforms/${soundId}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data: WaveformData) => {
        if (!cancelled) setWaveform(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [soundId]);

  return (
    <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 1">
      {waveform?.peaks.map((peak, idx) => {
        const ratio = waveform.max > 0 ? peak / waveform.max : 0;
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
