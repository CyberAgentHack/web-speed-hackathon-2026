import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
  lazy?: boolean;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 * lazy=true の場合、viewport 内に入ったときのみ自動再生を開始します。
 */
export const PausableMovie = ({ src, lazy = false }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(!lazy);

  useEffect(() => {
    if (!lazy) return;
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry!.isIntersecting) {
          void video.play().then(() => setIsPlaying(true));
          observer.disconnect();
        }
      },
      { rootMargin: "50px" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [lazy]);

  const handleClick = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setIsPlaying((playing) => {
      if (playing) {
        video.pause();
      } else {
        void video.play();
      }
      return !playing;
    });
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
          autoPlay={!lazy}
          className="h-full w-full object-cover"
          fetchPriority={lazy ? undefined : "high"}
          loop
          muted
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
    </AspectRatioBox>
  );
};
