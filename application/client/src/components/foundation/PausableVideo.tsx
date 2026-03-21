import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
  deferInitialLoad?: boolean;
  poster?: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableVideo = ({ src, deferInitialLoad = false, poster }: Props) => {
  const containerRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [shouldMountVideo, setShouldMountVideo] = useState(!deferInitialLoad);
  const [isPlaying, setIsPlaying] = useState(!prefersReducedMotion && !deferInitialLoad);

  useEffect(() => {
    if (!deferInitialLoad) {
      setShouldMountVideo(true);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setShouldMountVideo(true);
      return;
    }

    const container = containerRef.current;
    if (container == null) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldMountVideo(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: "200px 0px",
        threshold: 0.01,
      },
    );
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [deferInitialLoad]);

  useEffect(() => {
    if (!shouldMountVideo) {
      return;
    }

    const el = videoRef.current;
    if (el == null) {
      return;
    }

    if (prefersReducedMotion) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play().catch(() => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [prefersReducedMotion, shouldMountVideo]);

  const handleClick = useCallback(() => {
    if (!shouldMountVideo) {
      setShouldMountVideo(true);

      requestAnimationFrame(() => {
        const mounted = videoRef.current;
        if (mounted == null) {
          return;
        }
        mounted.play().catch(() => {
          setIsPlaying(false);
        });
        setIsPlaying(true);
      });
      return;
    }

    const el = videoRef.current;
    if (el == null) {
      return;
    }
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play().catch(() => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [isPlaying, shouldMountVideo]);

  return (
    <button
      aria-label="動画プレイヤー"
      className="group relative block h-full w-full"
      onClick={handleClick}
      ref={containerRef}
      type="button"
    >
      {shouldMountVideo ? (
        <video
          ref={videoRef}
          autoPlay={!prefersReducedMotion}
          className="h-full w-full object-contain"
          height={1080}
          loop
          muted
          poster={poster}
          playsInline
          preload={deferInitialLoad ? "none" : "auto"}
          src={src}
          width={1080}
        />
      ) : (
        <div className="h-full w-full" />
      )}
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
  );
};
