import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
}

export const PausableMovie = ({ src }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

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

  const handleClick = useCallback(() => {
    const video = videoRef.current;
    if (video == null) return;
    if (video.paused) {
      void video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video == null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <div ref={containerRef} className="h-full w-full">
        {isVisible ? (
          <button
            aria-label="動画プレイヤー"
            className="group relative block h-full w-full"
            onClick={handleClick}
            type="button"
          >
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              className="w-full"
              onLoadedMetadata={handleLoadedMetadata}
              preload="metadata"
              src={src}
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
        ) : (
          <div className="bg-cax-surface-subtle h-full w-full" />
        )}
      </div>
    </AspectRatioBox>
  );
};
