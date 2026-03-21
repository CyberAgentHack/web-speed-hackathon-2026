import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
  width?: number;
  height?: number;
  fetchPriority?: "high" | "low" | "auto";
}

/**
 * クリックすると再生/一時停止を切り替える動画プレイヤー。
 */
export const PausableMovie = ({ src, width, height, fetchPriority = "auto" }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsLoaded(true);
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    };

    video.addEventListener("canplay", handleCanPlay);
    return () => video.removeEventListener("canplay", handleCanPlay);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isLoaded) return;

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [src, isLoaded]);

  const handleClick = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isPlaying]);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      {isLoaded ? (
        <button
          aria-label="動画プレイヤー"
          className="group relative block h-full w-full"
          onClick={handleClick}
          type="button"
        >
          <video
            ref={videoRef}
            src={src}
            loop
            muted
            playsInline
            preload={fetchPriority === "high" ? "auto" : "metadata"}
            className="h-full w-full object-cover"
            width={width}
            height={height}
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
      ) : (
        <video
          ref={videoRef}
          src={src}
          loop
          muted
          playsInline
          preload={fetchPriority === "high" ? "auto" : "metadata"}
          className="h-full w-full object-cover"
          width={width}
          height={height}
        />
      )}
    </AspectRatioBox>
  );
};
