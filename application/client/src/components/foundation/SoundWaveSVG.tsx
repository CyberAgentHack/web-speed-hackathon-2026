import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

const PEAK_COUNT = 100;
const parsedDataCache = new Map<ArrayBuffer, ParsedData>();
const EMPTY_PARSED_DATA: ParsedData = {
  max: 1,
  peaks: Array.from({ length: PEAK_COUNT }, () => 0),
};

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (sharedAudioContext) return sharedAudioContext;

  const AudioContextCtor =
    window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (AudioContextCtor == null) return null;

  sharedAudioContext = new AudioContextCtor();
  return sharedAudioContext;
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const cached = parsedDataCache.get(data);
  if (cached) {
    return cached;
  }

  const audioCtx = getAudioContext();
  if (audioCtx == null) {
    parsedDataCache.set(data, EMPTY_PARSED_DATA);
    return EMPTY_PARSED_DATA;
  }

  // 音声をデコードする
  const buffer = await audioCtx.decodeAudioData(data.slice(0));

  const leftData = buffer.getChannelData(0);
  const rightData = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : leftData;

  // 左右の平均振幅を 100 chunk に圧縮する
  const chunkSize = Math.ceil(leftData.length / PEAK_COUNT);
  const peaks: number[] = [];
  for (let i = 0; i < leftData.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, leftData.length);
    let sum = 0;
    let count = 0;

    for (let j = i; j < end; j++) {
      sum += (Math.abs(leftData[j] ?? 0) + Math.abs(rightData[j] ?? 0)) / 2;
      count++;
    }

    peaks.push(count > 0 ? sum / count : 0);
  }
  // chunk の平均の中から最大値を取る
  const max = Math.max(...peaks, 0);

  const parsed = { max, peaks };
  parsedDataCache.set(data, parsed);

  return parsed;
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
    let isMounted = true;

    calculate(soundData).then(({ max, peaks }) => {
      if (!isMounted) {
        return;
      }

      setPeaks({ max, peaks });
    });

    return () => {
      isMounted = false;
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
