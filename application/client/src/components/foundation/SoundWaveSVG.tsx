import { useEffect, useRef, useState } from "react";
import { AudioContext } from "standardized-audio-context";

import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface ParsedData {
  max: number;
  peaks: number[];
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = new AudioContext();

  try {
    // 音声をデコードする
    const buffer = await audioCtx.decodeAudioData(data.slice(0));
    // 左の音声データの絶対値を取る
    const leftData = Array.from(buffer.getChannelData(0), Math.abs);
    // 右の音声データの絶対値を取る
    const rightData = Array.from(
      buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : buffer.getChannelData(0),
      Math.abs,
    );

    // 左右の音声データの平均を取る
    const normalized = leftData.map((leftValue, index) => mean([leftValue, rightData[index] ?? 0]));
    // 100 個の chunk に分ける
    const chunks = chunk(normalized, Math.ceil(normalized.length / 100));
    // chunk ごとに平均を取る
    const peaks = chunks.map(mean);
    // chunk の平均の中から最大値を取る
    const max = peaks.length > 0 ? Math.max(...peaks) : 0;

    return { max, peaks };
  } finally {
    void audioCtx.close();
  }
}

interface Props {
  soundSrc: string;
}

export const SoundWaveSVG = ({ soundSrc }: Props) => {
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
      void fetchBinary(soundSrc)
        .then(calculate)
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
  }, [soundSrc]);

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
