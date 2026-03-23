import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
  poster?: string;
}

export const PausableMovie = ({ src, poster }: Props) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver: ビューポートに入ったら再生開始、出たら停止
  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting && !reducedMotion) {
          void video.play();
          setIsPlaying(true);
        } else {
          video.pause();
          setIsPlaying(false);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleClick = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <div ref={containerRef} className="h-full w-full">
        <button
          aria-label="動画プレイヤー"
          className="group relative block h-full w-full"
          onClick={handleClick}
          type="button"
        >
          <video
            ref={videoRef}
            loop
            muted
            playsInline
            preload="none"
            className="h-full w-full object-cover"
            src={src}
            poster={poster}
          />
          <div
            className={classNames(
              "absolute left-1/2 top-1/2 flex items-center justify-center w-16 h-16 text-cax-surface-raised text-3xl bg-cax-overlay/50 rounded-full -translate-x-1/2 -translate-y-1/2",
              {
                "opacity-0 group-hover:opacity-100": isPlaying,
              },
            )}
          >
            <FontAwesomeIcon iconType={isPlaying ? "pause" : "play"} styleType="solid" />
          </div>
        </button>
      </div>
    </AspectRatioBox>
  );
};
