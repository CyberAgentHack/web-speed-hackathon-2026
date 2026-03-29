import { memo, useEffect, useMemo, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

const PEAK_COUNT = 64;
const VIEWBOX_WIDTH = 100;
const PRECISION_SCALE = 1000;

function quantize(value: number): number {
  return Math.round(value * PRECISION_SCALE) / PRECISION_SCALE;
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const AudioContextClass = window.AudioContext;
  if (!AudioContextClass) {
    return { max: 0, peaks: [] };
  }

  const audioCtx = new AudioContextClass();

  const buffer = await audioCtx.decodeAudioData(data.slice(0));
  const leftData = buffer.getChannelData(0);
  const rightData = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : leftData;

  const len = leftData.length;
  const chunkSize = Math.max(1, Math.ceil(len / PEAK_COUNT));
  const peaks: number[] = [];
  let max = 0;

  for (let i = 0; i < len; i += chunkSize) {
    let sum = 0;
    const end = Math.min(i + chunkSize, len);
    for (let j = i; j < end; j++) {
      sum += (Math.abs(leftData[j]!) + Math.abs(rightData[j]!)) / 2;
    }
    const avg = quantize(sum / (end - i));
    peaks.push(avg);
    if (avg > max) {
      max = avg;
    }
  }

  await audioCtx.close().catch(() => {});

  return { max, peaks };
}

interface Props {
  soundData: ArrayBuffer;
}

const SoundWaveSVGComponent = ({ soundData }: Props) => {
  const [{ max, peaks }, setPeaks] = useState<ParsedData>({
    max: 0,
    peaks: [],
  });

  useEffect(() => {
    let mounted = true;
    void calculate(soundData)
      .then(({ max, peaks }) => {
        if (mounted) {
          setPeaks({ max, peaks });
        }
      })
      .catch(() => {
        if (mounted) {
          setPeaks({ max: 0, peaks: [] });
        }
      });
    return () => {
      mounted = false;
    };
  }, [soundData]);

  const cell = VIEWBOX_WIDTH / PEAK_COUNT;

  const bars = useMemo(() => {
    if (max <= 0) {
      return [];
    }
    return peaks.map((peak, idx) => {
      const ratio = quantize(peak / max);
      return {
        height: ratio,
        idx,
        width: cell * 0.8,
        x: idx * cell + cell * 0.1,
        y: quantize(1 - ratio),
      };
    });
  }, [max, peaks, cell]);

  return (
    <svg className="h-full w-full" preserveAspectRatio="none" viewBox={`0 0 ${VIEWBOX_WIDTH} 1`}>
      {bars.map((bar) => {
        return (
          <rect
            key={bar.idx}
            fill="var(--color-cax-accent)"
            height={bar.height}
            width={bar.width}
            x={bar.x}
            y={bar.y}
          />
        );
      })}
    </svg>
  );
};

export const SoundWaveSVG = memo(SoundWaveSVGComponent);
