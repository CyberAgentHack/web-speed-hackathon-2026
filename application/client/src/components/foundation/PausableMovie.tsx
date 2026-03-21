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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video == null) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
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
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video == null || canvas == null) {
      return;
    }

    const syncCanvasSize = () => {
      const width = Math.max(video.videoWidth, 1);
      const height = Math.max(video.videoHeight, 1);
      canvas.width = width;
      canvas.height = height;
    };

    syncCanvasSize();
    video.addEventListener("loadedmetadata", syncCanvasSize);
    video.addEventListener("loadeddata", syncCanvasSize);

    return () => {
      video.removeEventListener("loadedmetadata", syncCanvasSize);
      video.removeEventListener("loadeddata", syncCanvasSize);
    };
  }, [src]);

  const handleClick = useCallback(() => {
    const video = videoRef.current;
    if (video == null) {
      return;
    }

    setIsPlaying((prev) => {
      if (prev) {
        video.pause();
      } else {
        void video.play();
      }

      return !prev;
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
          className="h-full w-full object-cover"
          loop
          muted
          playsInline
          preload="metadata"
          src={src}
        />
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full opacity-0" />
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
