import classNames from "classnames";
import { useEffect, useRef, useState, useCallback } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";

interface Props {
  src: string;
  fallbackImage?: string;
}

export const ClickToPlayVideo = ({ src, fallbackImage }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [isPlaying, setIsPlaying] = useState(!prefersReduceMotion);
  const [isFallbackImage, setIsFallbackImage] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || isFallbackImage) return;
    if (prefersReduceMotion) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play().catch(() => setIsPlaying(false));
    }
  }, [prefersReduceMotion]);

  const handleClick = useCallback(() => {
    if (isFallbackImage) return;
    const el = videoRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleError = useCallback(() => {
    if (fallbackImage) {
      setIsFallbackImage(true);
      setIsPlaying(false);
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
          <img className="h-full w-full object-contain" src={fallbackImage} alt="" loading="lazy" decoding="async" />
        ) : (
          <video
            ref={videoRef}
            className="h-full w-full object-contain"
            loop
            muted
            playsInline
            preload="metadata"
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
