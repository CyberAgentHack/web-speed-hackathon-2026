import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
}

export const PausableMovie = ({ src }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVisibleRef = useRef(false);
  const userPausedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry!.isIntersecting;
        isVisibleRef.current = visible;

        const video = videoRef.current;
        if (!video || !isReady) return;

        if (visible && !userPausedRef.current) {
          video.play();
          setIsPlaying(true);
        } else {
          video.pause();
          if (!visible) setIsPlaying(false);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [isReady]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isReady) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      userPausedRef.current = true;
      setIsPlaying(false);
      video.pause();
    } else if (isVisibleRef.current) {
      video.play();
    }
  }, [isReady]);

  const handleClick = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      userPausedRef.current = true;
      setIsPlaying(false);
    } else {
      video.play();
      userPausedRef.current = false;
      setIsPlaying(true);
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && video.readyState >= 2) {
      setIsReady(true);
    }
  }, []);

  const handleLoadedData = useCallback(() => {
    setIsReady(true);
  }, []);

  const handleError = useCallback(() => {
    const video = videoRef.current;
    if (!video || isReady) return;
    setTimeout(() => {
      if (videoRef.current && !isReady) {
        videoRef.current.load();
      }
    }, 2000);
  }, [isReady]);

  return (
    <div ref={containerRef}>
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
            loop
            muted
            playsInline
            preload="none"
            className="h-full w-full object-cover"
            src={src}
            onLoadedData={handleLoadedData}
            onError={handleError}
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
    </div>
  );
};
