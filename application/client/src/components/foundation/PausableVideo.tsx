import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableVideo = ({ src }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [isPlaying, setIsPlaying] = useState(!prefersReducedMotion);

  useEffect(() => {
    const el = videoRef.current;
    if (el == null) {
      return;
    }
    if (prefersReducedMotion) {
      el.pause();
    } else {
      el.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [prefersReducedMotion]);

  const handleClick = useCallback(() => {
    const el = videoRef.current;
    if (el == null) {
      return;
    }
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play().catch(() => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [isPlaying]);

  return (
    <button
      aria-label="動画プレイヤー"
      className="group relative block h-full w-full"
      onClick={handleClick}
      type="button"
    >
      <video
        ref={videoRef}
        autoPlay={!prefersReducedMotion}
        className="h-full w-full object-contain"
        height={1080}
        loop
        muted
        playsInline
        src={src}
        width={1080}
      />
      <div
        className={classNames(
          "absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-cax-overlay/50 text-3xl text-cax-surface-raised",
          {
            "opacity-0 group-hover:opacity-100": isPlaying,
          },
        )}
      >
        <FontAwesomeIcon iconType={isPlaying ? "pause" : "play"} styleType="solid" />
      </div>
    </button>
  );
};
