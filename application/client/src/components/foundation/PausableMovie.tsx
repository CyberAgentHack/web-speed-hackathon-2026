import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
}

/**
 * 標準の video 要素を使った動画再生コンポーネント
 */
export const PausableMovie = ({ src }: Props) => {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(!prefersReducedMotion);

  useEffect(() => {
    const video = videoRef.current;
    if (video === null) {
      return;
    }

    if (prefersReducedMotion) {
      setIsPlaying(false);
      video.pause();
      return;
    }

    setIsPlaying(true);
    void video.play().catch(() => {
      setIsPlaying(false);
    });
  }, [prefersReducedMotion]);

  const handleClick = useCallback(() => {
    const video = videoRef.current;
    if (video === null) {
      return;
    }

    if (video.paused) {
      void video
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          setIsPlaying(false);
        });
      return;
    }

    video.pause();
    setIsPlaying(false);
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
          autoPlay={!prefersReducedMotion}
          className="h-full w-full object-cover"
          loop
          muted
          playsInline
          preload="metadata"
        >
          <source src={src} type="video/mp4" />
        </video>
        <div
          className={classNames(
            "absolute left-1/2 top-1/2 flex items-center justify-center w-16 h-16 text-cax-surface-raised text-3xl bg-cax-overlay/50 rounded-full -translate-x-1/2 -translate-y-1/2",
            {
              "opacity-0 group-hover:opacity-100": isPlaying,
            },
          )}
        >
          <FontAwesomeIcon
            iconType={isPlaying ? "pause" : "play"}
            styleType="solid"
          />
        </div>
      </button>
    </AspectRatioBox>
  );
};
