import classNames from "classnames";
import { useCallback, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { useVisibility } from "@web-speed-hackathon-2026/client/src/hooks/use_visibility";

interface Props {
  deferUntilVisible?: boolean;
  src: string;
}

type MovieStatus = "loading" | "ready" | "error";

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ deferUntilVisible = false, src }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isVisible, targetRef } = useVisibility<HTMLDivElement>({
    initialVisible: !deferUntilVisible,
    once: true,
    rootMargin: "256px",
  });
  const [status, setStatus] = useState<MovieStatus>("loading");
  const [isPlaying, setIsPlaying] = useState(false);
  const isReady = status === "ready";

  const handleLoadStart = useCallback(() => {
    setStatus("loading");
    setIsPlaying(false);
  }, []);

  const handleLoadedData = useCallback(() => {
    const video = videoRef.current;

    if (video === null) {
      return;
    }

    setStatus("ready");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      setIsPlaying(false);
      return;
    }

    if (video.paused) {
      void video.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleError = useCallback(() => {
    setStatus("error");
    setIsPlaying(false);
  }, []);

  const handleClick = useCallback(() => {
    const video = videoRef.current;

    if (!isReady) {
      return;
    }

    if (video === null) {
      return;
    }

    if (video.paused) {
      void video.play().catch(() => {
        setIsPlaying(false);
      });
      return;
    }

    video.pause();
  }, [isReady]);

  return (
    <div ref={targetRef} className="h-full w-full">
      <AspectRatioBox aspectHeight={1} aspectWidth={1}>
        {isVisible ? (
          <button
            aria-busy={status === "loading"}
            aria-label="動画プレイヤー"
            className="group relative block h-full w-full disabled:cursor-default"
            disabled={!isReady}
            onClick={handleClick}
            type="button"
          >
            <video
              ref={videoRef}
              autoPlay
              className={classNames("h-full w-full object-cover", {
                invisible: !isReady,
              })}
              loop
              muted
              onError={handleError}
              onLoadedData={handleLoadedData}
              onLoadStart={handleLoadStart}
              onPause={handlePause}
              onPlay={handlePlay}
              playsInline
              preload="metadata"
              src={src}
            />
            {isReady ? (
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
            ) : (
              <div
                className={classNames(
                  "absolute inset-0 flex h-full w-full items-center justify-center bg-cax-surface-subtle text-cax-text-muted",
                  {
                    "animate-pulse": status === "loading",
                  },
                )}
              >
                <span className="rounded-full bg-cax-surface-raised/80 px-3 py-1 text-xs font-bold tracking-[0.2em]">
                  {status === "error" ? "Unavailable" : "Loading..."}
                </span>
              </div>
            )}
          </button>
        ) : (
          <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-cax-surface-subtle text-cax-text-muted">
            <span className="rounded-full bg-cax-surface-raised/80 px-3 py-1 text-xs font-bold tracking-[0.2em]">
              Video
            </span>
          </div>
        )}
      </AspectRatioBox>
    </div>
  );
};
