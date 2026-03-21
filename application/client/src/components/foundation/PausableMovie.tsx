import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
  poster?: string;
  isLCP?: boolean;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ src, poster, isLCP }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const video = videoRef.current;
    if (video == null) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      setIsPlaying(false);
    } else {
      const startPlay = () => {
        void video.play().then(() => setIsPlaying(true));
      };
      const id =
        "requestIdleCallback" in window
          ? window.requestIdleCallback(startPlay, { timeout: 3000 })
          : window.setTimeout(startPlay, 1000);
      return () => {
        if ("requestIdleCallback" in window) {
          window.cancelIdleCallback(id);
        } else {
          clearTimeout(id);
        }
      };
    }
  }, [isVisible]);

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

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <div ref={containerRef} className="h-full w-full">
        <button
          aria-label="動画プレイヤー"
          className="group relative block h-full w-full"
          onClick={handleClick}
          type="button"
        >
          {poster && !isPlaying && (
            <img
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              fetchPriority={isLCP ? "high" : undefined}
              loading={isLCP ? "eager" : "lazy"}
              src={poster}
            />
          )}
          <video
            ref={videoRef}
            loop
            muted
            playsInline
            preload={isVisible ? "auto" : "none"}
            className="h-full w-full object-cover"
            poster={poster}
            src={isVisible ? src : undefined}
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
