import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
}

export const PausableMovie = ({ src }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
  const isVisibleRef = useRef(false);
  const userPausedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const startDrawLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawFrame = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        ctx.drawImage(video, 0, 0);
      }
      rafRef.current = requestAnimationFrame(drawFrame);
    };
    rafRef.current = requestAnimationFrame(drawFrame);
  }, []);

  const stopDrawLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
  }, []);

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
          startDrawLoop();
        } else {
          video.pause();
          stopDrawLoop();
          if (!visible) setIsPlaying(false);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [isReady, startDrawLoop, stopDrawLoop]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isReady) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      userPausedRef.current = true;
      setIsPlaying(false);
      video.pause();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
      }
    } else if (isVisibleRef.current) {
      startDrawLoop();
    }

    return () => stopDrawLoop();
  }, [isReady, startDrawLoop, stopDrawLoop]);

  const handleClick = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      stopDrawLoop();
      userPausedRef.current = true;
      setIsPlaying(false);
    } else {
      video.play();
      userPausedRef.current = false;
      setIsPlaying(true);
      startDrawLoop();
    }
  }, [isPlaying, startDrawLoop, stopDrawLoop]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && video.readyState >= 2) {
      setIsReady(true);
    }
  }, []);

  const handleLoadedData = useCallback(() => {
    setIsReady(true);
  }, []);

  return (
    <div ref={containerRef}>
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="none"
        className="sr-only"
        src={src}
        onLoadedData={handleLoadedData}
      />
      <AspectRatioBox aspectHeight={1} aspectWidth={1}>
        {isReady ? (
          <button
            aria-label="動画プレイヤー"
            className="group relative block h-full w-full"
            onClick={handleClick}
            type="button"
          >
            <canvas ref={canvasRef} className="w-full" />
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
        ) : null}
      </AspectRatioBox>
    </div>
  );
};
