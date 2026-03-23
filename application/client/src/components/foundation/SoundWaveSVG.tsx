import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

const cache = new Map<string, ParsedData>();

async function fetchWaveform(soundId: string): Promise<ParsedData> {
  const cached = cache.get(soundId);
  if (cached) {
    return cached;
  }
  const response = await fetch(`/api/v1/sounds/${soundId}/waveform`);
  const result = (await response.json()) as ParsedData;
  cache.set(soundId, result);
  return result;
}

interface Props {
  soundId: string;
  waveform?: ParsedData;
}

export const SoundWaveSVG = ({ soundId, waveform }: Props) => {
  const uniqueIdRef = useRef(Math.random().toString(16));
  const [{ max, peaks }, setPeaks] = useState<ParsedData>(waveform ?? { max: 0, peaks: [] });

  useEffect(() => {
    if (waveform) {
      setPeaks(waveform);
      return;
    }
    fetchWaveform(soundId).then(({ max, peaks }) => {
      setPeaks({ max, peaks });
    });
  }, [soundId, waveform]);

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
