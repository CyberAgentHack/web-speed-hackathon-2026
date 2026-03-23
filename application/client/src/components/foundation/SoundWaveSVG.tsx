import { useEffect, useRef, useState } from "react";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { getSoundPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface ParsedData {
  max: number;
  peaks: number[];
}

let sharedAudioCtx: AudioContext | null = null;
function getAudioContext() {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioContext();
  }
  return sharedAudioCtx;
}

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = getAudioContext();
  const buffer = await audioCtx.decodeAudioData(data.slice(0));
  
  const leftChannel = buffer.getChannelData(0);
  const rightChannel = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : leftChannel;
  const length = buffer.length;

  const numPeaks = 100;
  const chunkSize = Math.floor(length / numPeaks);
  const peaks = new Array(numPeaks).fill(0);
  let max = 0;

  for (let i = 0; i < numPeaks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, length);
    let sum = 0;
    for (let j = start; j < end; j++) {
      const left = leftChannel[j] ?? 0;
      const right = rightChannel[j] ?? 0;
      sum += (Math.abs(left) + Math.abs(right)) / 2;
    }
    const avg = sum / (end - start || 1);
    peaks[i] = avg;
    if (avg > max) max = avg;
  }

  return { max, peaks };
}

interface Props {
  sound: Models.Sound;
}

export const SoundWaveSVG = ({ sound }: Props) => {
  const uniqueId = useRef(Math.random().toString(16)).current;
  const containerRef = useRef<SVGSVGElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [{ max, peaks }, setPeaks] = useState<ParsedData>({
    max: 0,
    peaks: [],
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0] && entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "500px" }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let isCancelled = false;
    
    fetchBinary(getSoundPath(sound.id)).then((data) => {
      if (isCancelled) return;
      return calculate(data).then((result) => {
        if (!isCancelled) {
          setPeaks(result);
        }
      });
    }).catch(console.error);

    return () => {
      isCancelled = true;
    };
  }, [isVisible, sound.id]);

  return (
    <svg ref={containerRef} className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 1">
      {peaks.length > 0 ? peaks.map((peak, idx) => {
        const ratio = max > 0 ? peak / max : 0;
        return (
          <rect
            key={`${uniqueId}#${idx}`}
            fill="var(--color-cax-accent)"
            height={ratio}
            width="1"
            x={idx}
            y={1 - ratio}
          />
        );
      }) : null}
    </svg>
  );
};
