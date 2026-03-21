import { clsx } from "clsx";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const userPausedRef = useRef(false);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const video = videoRef.current;
    if (video === null || prefersReducedMotion) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }

        if (entry.isIntersecting) {
          if (!userPausedRef.current) {
            video.play();
          }
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(video);
    return () => {
      observer.disconnect();
    };
  }, [prefersReducedMotion]);

  const handleClick = useCallback(() => {
    const video = videoRef.current;
    if (video === null) {
      return;
    }

    if (video.paused) {
      userPausedRef.current = false;
      video.play();
    } else {
      userPausedRef.current = true;
      video.pause();
    }
  }, []);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full"
        onClick={handleClick}
        type="button"
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          loop
          muted
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          playsInline
          preload="none"
          src={src}
        />
        <div
          className={clsx(
            "absolute left-1/2 top-1/2 flex items-center justify-center w-16 h-16 text-cax-surface-raised text-3xl bg-cax-overlay/50 rounded-full -translate-x-1/2 -translate-y-1/2",
            {
              "opacity-0 group-hover:opacity-100": isPlaying,
            },
          )}
        >
          <FontAwesomeIcon iconType={isPlaying ? "pause" : "play"} styleType="solid" />
        </div>
      </button>
    </AspectRatioBox>
  );
};
