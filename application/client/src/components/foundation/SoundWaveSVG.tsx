import { useEffect, useRef, useState } from "react";
import { AudioContext } from "standardized-audio-context";

interface ParsedData {
  max: number;
  peaks: number[];
}

// AudioContext は再利用する
let sharedAudioCtx: AudioContext | null = null;
function getAudioCtx() {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioContext();
  }
  return sharedAudioCtx;
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = getAudioCtx();

  // 音声をデコードする（ここはどうしても時間がかかるが、ブラウザ内部で非同期に行われる）
  const buffer = await audioCtx.decodeAudioData(data.slice(0));
  
  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;
  const length = buffer.length;
  
  const numChunks = 100;
  const chunkSize = Math.floor(length / numChunks);
  const peaks: number[] = new Array(numChunks);
  let globalMax = 0;

  // 巨大な配列を lodash で回すのではなく、必要な箇所だけサンプリングして計算する
  // これによりメインスレッドの占有時間を劇的に短縮（TBT対策）
  for (let i = 0; i < numChunks; i++) {
    let sum = 0;
    const start = i * chunkSize;
    const end = start + chunkSize;
    
    // 各チャンク内をさらにサンプリングして高速化
    const step = Math.max(1, Math.floor(chunkSize / 100)); 
    let count = 0;
    for (let j = start; j < end; j += step) {
      const val = (Math.abs(left[j]) + Math.abs(right[j])) / 2;
      sum += val;
      count++;
    }
    const avg = sum / count;
    peaks[i] = avg;
    if (avg > globalMax) globalMax = avg;
  }

  return { max: globalMax || 1, peaks };
}

interface Props {
  soundData: ArrayBuffer;
}

export const SoundWaveSVG = ({ soundData }: Props) => {
  const [{ max, peaks }, setPeaks] = useState<ParsedData>({
    max: 0,
    peaks: [],
  });

  useEffect(() => {
    let isMounted = true;
    calculate(soundData).then((result) => {
      if (isMounted) setPeaks(result);
    });
    return () => { isMounted = false; };
  }, [soundData]);

  // 100個の rect を作る代わりに、1つの path で描画して DOM 負荷を削減
  const pathData = peaks.map((peak, i) => {
    const ratio = peak / max;
    const height = Math.max(0.05, ratio); // 最低限の高さを持たせる
    return `M ${i} ${1 - height} L ${i} 1 L ${i+0.8} 1 L ${i+0.8} ${1 - height} Z`;
  }).join(" ");

  return (
    <svg 
      className="h-full w-full" 
      preserveAspectRatio="none" 
      viewBox="0 0 100 1"
      style={{ shapeRendering: "crispEdges" }}
    >
      <path
        d={pathData}
        fill="var(--color-cax-accent)"
      />
    </svg>
  );
};
