import classNames from "classnames";
import { MouseEvent, useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  preload?: "auto" | "metadata" | "none";
  src: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ preload = "none", src }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [isPlaying, setIsPlaying] = useState(!prefersReducedMotion);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !prefersReducedMotion) return;
    video.pause();
  }, [prefersReducedMotion]);

const handleClick = useCallback(
    (ev: MouseEvent) => {
      const video = videoRef.current;
      if (!video) return;
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    },
    [isPlaying],
  );

  return (
    <>
      {preload === "auto" && <link as="video" fetchPriority="high" href={src} rel="preload" />}
      <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full"
        data-navigable
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
          preload={preload}
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
          <FontAwesomeIcon
            iconType={isPlaying ? "pause" : "play"}
            styleType="solid"
          />
        </div>
      </button>
    </AspectRatioBox>
    </>
  );
};
