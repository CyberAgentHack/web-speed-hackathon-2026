import classNames from "classnames";
import { useCallback, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
  preload?: "auto" | "none";
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ src, preload }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoadedData = useCallback(() => {
    setIsLoaded(true);
    const video = videoRef.current;
    if (!video) return;

    // 視覚効果 off のとき自動再生しない
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsPlaying(false);
      video.pause();
    }
  }, []);

  const handleClick = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsPlaying((isPlaying) => {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      return !isPlaying;
    });
  }, []);

  if (!src) {
    return null;
  }

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
          autoPlay
          className="w-full"
          loop
          muted
          onLoadedData={handleLoadedData}
          playsInline
          preload={preload}
          src={src}
        />
        {isLoaded && (
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
        )}
      </button>
    </AspectRatioBox>
  );
};
