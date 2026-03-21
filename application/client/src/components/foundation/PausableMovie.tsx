import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
  isFv: boolean;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ src, isFv }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const handleClick = useCallback(() => {
    setIsPlaying((isPlaying) => {
      if (isPlaying) {
        videoRef.current?.pause();
      } else {
        videoRef.current?.play();
      }
      return !isPlaying;
    });
  }, []);

  useEffect(() => {
    const videoElm = videoRef.current;
    if (videoElm == null) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          // NOTE: 初めて画面に入った時に読み込む
          if (videoElm.src == null || videoElm.src === "") {
            videoElm.src = src;
          }
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(videoElm);

    return () => observer.disconnect();
  }, [src]);

  return (
    <button
      aria-label="動画プレイヤー"
      className="group relative block h-full w-full"
      onClick={handleClick}
      type="button"
    >
      <video
        ref={videoRef}
        src={isFv ? src : undefined}
        poster={src.replace(".webm", "_thumb.webp")}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full"
      />
      <div
        className={classNames(
          "absolute left-1/2 top-1/2 flex items-center justify-center w-16 h-16 text-cax-surface-raised text-3xl bg-cax-overlay/50 rounded-full -translate-x-1/2 -translate-y-1/2",
          {
            "opacity-0 group-hover:opacity-100": isPlaying,
          },
        )}
      >
        {isPlaying ? (
          <svg width="30" height="30" viewBox="0 0 448 512" fill="currentColor">
            <path d="M144 479H48c-26.5 0-48-21.5-48-48V79c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48zm304-48V79c0-26.5-21.5-48-48-48h-96c-26.5 0-48 21.5-48 48v352c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48z"></path>
          </svg>
        ) : (
          <svg width="30" height="30" viewBox="0 0 448 512" fill="currentColor">
            <path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"></path>
          </svg>
        )}
      </div>
    </button>
  );
};
