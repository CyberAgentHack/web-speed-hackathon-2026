import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

async function calculate(url: string): Promise<ParsedData> {
  const res = await fetch(url);
  const data = await res.arrayBuffer();
  const audioCtx = new AudioContext();

  const buffer = await audioCtx.decodeAudioData(data);
  const leftData = buffer.getChannelData(0);
  const rightData = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : null;

  const chunkSize = Math.ceil(leftData.length / 100);
  const peaks: number[] = [];
  for (let i = 0; i < leftData.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, leftData.length);
    let sum = 0;
    for (let j = i; j < end; j++) {
      const l = Math.abs(leftData[j]!);
      const r = rightData ? Math.abs(rightData[j]!) : 0;
      sum += (l + r) / (rightData ? 2 : 1);
    }
    peaks.push(sum / (end - i));
  }
  const max = Math.max(...peaks, 0);

  audioCtx.close();
  return { max, peaks };
}

interface Props {
  soundUrl: string;
}

export const SoundWaveSVG = ({ soundUrl }: Props) => {
  const uniqueIdRef = useRef(Math.random().toString(16));
  const containerRef = useRef<SVGSVGElement>(null);
  const [{ max, peaks }, setPeaks] = useState<ParsedData>({
    max: 0,
    peaks: [],
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    calculate(soundUrl).then(({ max, peaks }) => {
      setPeaks({ max, peaks });
    });
  }, [soundUrl, isVisible]);

  return (
    <svg ref={containerRef} className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 1">
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
