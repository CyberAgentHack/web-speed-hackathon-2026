import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = new AudioContext();
  const peakCount = 100;

  try {
    // 音声をデコードする
    const buffer = await audioCtx.decodeAudioData(data.slice(0));
    const leftData = buffer.getChannelData(0);
    const rightData = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : leftData;

    const chunkSize = Math.max(Math.ceil(leftData.length / peakCount), 1);
    const peaks = new Array(peakCount).fill(0);
    let max = 0;

    for (let i = 0; i < peakCount; i += 1) {
      const start = i * chunkSize;
      if (start >= leftData.length) {
        break;
      }
      const end = Math.min(start + chunkSize, leftData.length);

      let sum = 0;
      for (let j = start; j < end; j += 1) {
        const value = (Math.abs(leftData[j]!) + Math.abs(rightData[j]!)) / 2;
        sum += value;
      }

      const peak = sum / (end - start);
      peaks[i] = peak;
      if (peak > max) {
        max = peak;
      }
    }

    return { max, peaks };
  } finally {
    void audioCtx.close().catch(() => undefined);
  }
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
    let active = true;

    const requestIdle =
      window.requestIdleCallback as ((cb: IdleRequestCallback, opts?: IdleRequestOptions) => number)
      | undefined;
    const cancelIdle = window.cancelIdleCallback as ((handle: number) => void) | undefined;

    const run = () => {
      void calculate(soundData).then(({ max, peaks }) => {
        if (active) {
          setPeaks({ max, peaks });
        }
      });
    };

    const idleHandle =
      requestIdle != null ? requestIdle(() => run(), { timeout: 1000 }) : window.setTimeout(run, 0);

    return () => {
      active = false;
      if (requestIdle != null && cancelIdle != null) {
        cancelIdle(idleHandle);
      } else {
        window.clearTimeout(idleHandle);
      }
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
