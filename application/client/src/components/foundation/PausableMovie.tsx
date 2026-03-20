import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ src }: Props) => {
  const thumbSrc = src.replace(".webp", "_thumb.jpg");
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
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
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      void video.play();
    }
    setIsPlaying((p) => !p);
  }, [isPlaying]);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <div ref={containerRef} className="relative h-full w-full">
        {/* Thumbnail: LCP element shown immediately before video is ready */}
        {!isLoaded && (
          <img
            alt=""
            className="absolute inset-0 h-full w-full object-cover z-10"
            src={thumbSrc}
          />
        )}
        {isNearViewport && (
          <button
            aria-label="動画プレイヤー"
            className="group absolute inset-0 block h-full w-full"
            onClick={handleClick}
            type="button"
          >
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
              src={src}
              onLoadedMetadata={() => setIsLoaded(true)}
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
        )}
      </div>
    </AspectRatioBox>
  );
};
