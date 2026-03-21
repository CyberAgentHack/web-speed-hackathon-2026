import classNames from "classnames";
import { MouseEvent, useCallback, useEffect, useRef, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPause, faPlay } from "@fortawesome/free-solid-svg-icons";

interface Props {
  src: string;
  interactive?: boolean;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ src, interactive }: Props) => {
  const [paused, setPaused] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      return;
    }

    setPaused(false);
    video.play().catch(() => {
      video.pause();
      setPaused(true);
    });
  }, []);

  const handleClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (video.paused) {
      video.play();
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  }, []);

  return (
    <div className="w-full aspect-square">
      <div
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full cursor-pointer"
        onClick={handleClick}
        role="button"
      >
        <video
          ref={videoRef}
          className="w-full"
          src={src}
          preload={interactive ? "auto" : "metadata"}
          autoPlay
          loop
          muted
          playsInline
        />
        <div
          className={classNames(
            "absolute left-1/2 top-1/2 flex items-center justify-center w-16 h-16 text-cax-surface-raised text-3xl bg-cax-overlay/50 rounded-full -translate-x-1/2 -translate-y-1/2",
            {
              "opacity-0 group-hover:opacity-100": paused,
            },
          )}
        >
          <FontAwesomeIcon icon={paused ? faPause : faPlay} />
        </div>
      </div>
    </div>
  );
};
