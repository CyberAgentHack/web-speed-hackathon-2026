import { useEffect, useRef, useState } from "react";

interface ParsedData {
  max: number;
  peaks: number[];
}

interface Props {
  soundUrl: string;
}

export const SoundWaveSVG = ({ soundUrl }: Props) => {
  const uniqueIdRef = useRef(Math.random().toString(16));
  const containerRef = useRef<SVGSVGElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [{ max, peaks }, setPeaks] = useState<ParsedData>({
    max: 0,
    peaks: [],
  });

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

    let cancelled = false;
    const peaksUrl = soundUrl.replace(/\.mp3$/, ".peaks.json");

    function tryFetch(retries: number) {
      fetch(peaksUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch peaks: ${res.status}`);
          return res.json();
        })
        .then((data: ParsedData) => {
          if (!cancelled) {
            setPeaks(data);
          }
        })
        .catch(() => {
          if (!cancelled && retries > 0) {
            setTimeout(() => tryFetch(retries - 1), 2000);
          }
        });
    }
    tryFetch(15);

    return () => {
      cancelled = true;
    };
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
