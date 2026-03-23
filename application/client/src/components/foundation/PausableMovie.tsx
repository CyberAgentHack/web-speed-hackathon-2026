import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
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

  useEffect(() => {
    const video = videoRef.current;
    if (video == null) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      setIsPlaying(false);
      return;
    }

    void video.play().then(
      () => {
        setIsPlaying(true);
      },
      () => {
        setIsPlaying(false);
      },
    );
  }, []);

  const handleClick = useCallback(() => {
    const video = videoRef.current;
    if (video == null) {
      return;
    }

    if (video.paused) {
      void video.play().then(
        () => {
          setIsPlaying(true);
        },
        () => {
          setIsPlaying(false);
        },
      );
      return;
    }

    video.pause();
    setIsPlaying(false);
  }, []);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full"
        onClick={handleClick}
        type="button"
      >
        <canvas aria-hidden="true" className="absolute h-px w-px opacity-0 pointer-events-none" />
        <video
          ref={videoRef}
          autoPlay
          className="h-full w-full object-cover"
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
