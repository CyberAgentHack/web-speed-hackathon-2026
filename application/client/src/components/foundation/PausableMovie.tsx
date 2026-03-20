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
        console.log("IntersectionObserver", entry?.isIntersecting);
        if (entry?.isIntersecting) {
          // NOTE: 初めて画面に入った時に読み込む
          if (videoElm.src == null || videoElm.src === "") {
            console.log("Load video", src);
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
        <FontAwesomeIcon
          iconType={isPlaying ? "pause" : "play"}
          styleType="solid"
        />
      </div>
    </button>
  );
};
