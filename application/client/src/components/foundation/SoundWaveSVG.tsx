import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

const workerRef = new Worker(new URL("./calculate.worker.ts", import.meta.url));

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  return new Promise((resolve) => {
    const audioCtx = new (window as any).AudioContext();

    audioCtx.decodeAudioData(data.slice(0), (buffer: AudioBuffer) => {
      // 左の音声データの絶対値を取る（Float32Array のまま保持）
      const leftChannelData = buffer.getChannelData(0);
      const leftData = new Float32Array(leftChannelData.length);
      for (let i = 0; i < leftChannelData.length; i++) {
        const sample = leftChannelData[i];
        if (sample == null) {
          continue;
        }
        leftData[i] = Math.abs(sample);
      }

      // 右の音声データの絶対値を取る
      const rightChannelData = buffer.getChannelData(1);
      const rightData = rightChannelData
        ? (() => {
            const right = new Float32Array(rightChannelData.length);
            for (let i = 0; i < rightChannelData.length; i++) {
              const sample = rightChannelData[i];
              if (sample == null) {
                continue;
              }
              right[i] = Math.abs(sample);
            }
            return right;
          })()
        : null;

      // Worker に処理を委譲
      const messageHandler = (event: MessageEvent<ParsedData>) => {
        workerRef.removeEventListener("message", messageHandler);
        resolve(event.data);
      };

      workerRef.addEventListener("message", messageHandler);

      // Construct transfer list
      const transferList = [leftData.buffer];
      const messageData: any = {
        left: leftData,
        right: rightData,
      };

      if (rightData) {
        transferList.push(rightData.buffer);
      }

      workerRef.postMessage(messageData, transferList);
    });
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
