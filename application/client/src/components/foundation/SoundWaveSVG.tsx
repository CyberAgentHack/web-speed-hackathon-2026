import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

interface WorkerResponse {
  id: number;
  max: number;
  peaks: number[];
}

let _worker: Worker | null = null;
let _nextId = 0;
const _pending = new Map<number, { resolve: (data: ParsedData) => void; reject: (err: Error) => void }>();

function getSoundWaveWorker(): Worker {
  if (!_worker) {
    _worker = new Worker(
      /* webpackChunkName: "sound-wave-worker" */
      new URL("../../utils/sound_wave.worker", import.meta.url),
      { type: "module" },
    );
    _worker.onmessage = (ev: MessageEvent<WorkerResponse>) => {
      const { id, max, peaks } = ev.data;
      const p = _pending.get(id);
      if (!p) return;
      _pending.delete(id);
      p.resolve({ max, peaks });
    };
    _worker.onerror = (ev) => {
      for (const [, p] of _pending) {
        p.reject(new Error(`Worker error: ${ev.message}`));
      }
      _pending.clear();
    };
  }
  return _worker;
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = new AudioContext();
  const buffer = await audioCtx.decodeAudioData(data.slice(0));
  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;

  const leftCopy = new Float32Array(left);
  const rightCopy = new Float32Array(right);
  const id = _nextId++;

  return new Promise((resolve, reject) => {
    _pending.set(id, { resolve, reject });
    const transferList: Transferable[] = [leftCopy.buffer];
    if (rightCopy.buffer !== leftCopy.buffer) transferList.push(rightCopy.buffer);
    getSoundWaveWorker().postMessage({ id, leftData: leftCopy, rightData: rightCopy }, transferList);
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
