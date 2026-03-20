import classNames from "classnames";
import { useCallback, useRef, useState } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ src }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const handleClick = useCallback(() => {
    setIsPlaying((isPlaying) => {
      const video = videoRef.current;
      if (video == null) {
        return isPlaying;
      }

      if (isPlaying) {
        video.pause();
      } else {
        void video.play();
      }

      return !isPlaying;
    });
  }, []);

  const handleLoadedData = useCallback(() => {
    const video = videoRef.current;
    if (video == null) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      setIsPlaying(false);
      return;
    }

    void video.play();
    setIsPlaying(true);
  }, []);

  return (
    <div className="w-full" style={{ aspectRatio: "1 / 1" }}>
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
          onLoadedData={handleLoadedData}
          playsInline
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
    </div>
  );
};
