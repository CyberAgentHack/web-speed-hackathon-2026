import classNames from "classnames";
import { useEffect, useRef, useState, useCallback } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";

interface Props {
  src: string;
  fallbackImage?: string;
  poster?: string;
}

export const ClickToPlayVideo = ({ src, fallbackImage, poster }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFallbackImage, setIsFallbackImage] = useState(false);

  useEffect(() => {
    if (prefersReduceMotion) {
      setIsPlaying(false);
      videoRef.current?.pause();
    }
  }, [prefersReduceMotion]);

  const handleClick = useCallback(() => {
    if (isFallbackImage) return;
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }, [isFallbackImage]);

  const handleError = useCallback(() => {
    if (fallbackImage) {
      setIsFallbackImage(true);
      setIsPlaying(true);
    }
  }, [fallbackImage]);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full"
        onClick={handleClick}
        type="button"
      >
        {isFallbackImage ? (
          <img
            className="h-full w-full object-contain"
            src={fallbackImage}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <video
            ref={videoRef}
            className="h-full w-full object-contain"
            loop
            muted
            playsInline
            preload="metadata"
            poster={poster || fallbackImage}
            src={src}
            onError={handleError}
          />
        )}
        <div
          className={classNames(
            "absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-cax-overlay/60 text-2xl text-cax-surface-raised transition-opacity",
            {
              "opacity-100": !isPlaying,
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
