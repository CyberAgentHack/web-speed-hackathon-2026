import _ from "lodash";
import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = new window.AudioContext();

  try {
    // 音声をデコードする
    const buffer = await audioCtx.decodeAudioData(data.slice(0));
    // 左の音声データの絶対値を取る
    const leftData = _.map(buffer.getChannelData(0), Math.abs);
    // 右の音声データの絶対値を取る
    const rightData = _.map(buffer.getChannelData(1), Math.abs);

    // 左右の音声データの平均を取る
    const normalized = _.map(_.zip(leftData, rightData), _.mean);
    // 100 個の chunk に分ける
    const chunks = _.chunk(normalized, Math.ceil(normalized.length / 100));
    // chunk ごとに平均を取る
    const peaks = _.map(chunks, _.mean);
    // chunk の平均の中から最大値を取る
    const max = _.max(peaks) ?? 0;

    return { max, peaks };
  } finally {
    await audioCtx.close();
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
    calculate(soundData).then(({ max, peaks }) => {
      setPeaks({ max, peaks });
    });
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
