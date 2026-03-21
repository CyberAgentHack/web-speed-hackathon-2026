import { useEffect, useMemo, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = new AudioContext();

  // 音声をデコードする（AudioContext はワーカー内では使えないためメインスレッドで実行）
  const buffer = await audioCtx.decodeAudioData(data.slice(0));

  // デコード済みの Float32Array をワーカーに転送してピーク計算をオフロードする
  const left = new Float32Array(buffer.getChannelData(0));
  const right = new Float32Array(
    buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : buffer.getChannelData(0),
  );

  return new Promise<ParsedData>((resolve, reject) => {
    const worker = new Worker(
      new URL("../../workers/sound_wave_worker.ts", import.meta.url),
    );
    worker.onmessage = (e: MessageEvent<ParsedData>) => {
      resolve(e.data);
      worker.terminate();
    };
    worker.onerror = (err) => {
      reject(err);
      worker.terminate();
    };
    // transferable として渡してコピーを省く
    worker.postMessage({ left, right }, [left.buffer, right.buffer]);
  });
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

  // soundData の参照が変わらない限り calculate() を再実行しない
  const calculationPromise = useMemo(() => calculate(soundData), [soundData]);

  useEffect(() => {
    calculationPromise.then(({ max, peaks }) => {
      setPeaks({ max, peaks });
    });
  }, [calculationPromise]);

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
