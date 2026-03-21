import classNames from "classnames";
import { RefCallback, useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ src }: Props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isInViewportRef = useRef(true);

  const stopDrawing = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas === null || video === null || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return;
    }

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const context = canvas.getContext("2d");
    if (context === null) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = useCallback(() => {
    stopDrawing();

    const render = () => {
      if (!isInViewportRef.current) {
        animationFrameRef.current = null;
        return;
      }

      drawFrame();

      const video = videoRef.current;
      if (video !== null && !video.paused && !video.ended && isInViewportRef.current) {
        animationFrameRef.current = window.requestAnimationFrame(render);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(render);
  }, [drawFrame, stopDrawing]);

  const canvasCallbackRef = useCallback<RefCallback<HTMLCanvasElement>>(
    (el) => {
      canvasRef.current = el;
      drawFrame();
    },
    [drawFrame],
  );

  const buttonCallbackRef = useCallback<RefCallback<HTMLButtonElement>>((el) => {
    buttonRef.current = el;
  }, []);

  useEffect(() => {
    const target = buttonRef.current;
    if (target === null || typeof window.IntersectionObserver === "undefined") {
      isInViewportRef.current = true;
      return;
    }

    const observer = new window.IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry === undefined) {
        return;
      }

      const isInViewport = entry.isIntersecting;
      if (isInViewportRef.current === isInViewport) {
        return;
      }

      isInViewportRef.current = isInViewport;

      if (!isInViewport) {
        stopDrawing();
        return;
      }

      const video = videoRef.current;
      if (video !== null && !video.paused && !video.ended) {
        startDrawing();
      } else {
        drawFrame();
      }
    });

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [drawFrame, startDrawing, stopDrawing]);

  useEffect(() => {
    stopDrawing();

    const previousVideo = videoRef.current;
    if (previousVideo !== null) {
      previousVideo.pause();
      previousVideo.removeAttribute("src");
      previousVideo.load();
      videoRef.current = null;
    }

    setIsLoading(true);

    const video = document.createElement("video");
    video.preload = "auto";
    video.playsInline = true;
    video.loop = true;
    video.muted = true;
    video.src = src;
    videoRef.current = video;

    const handleLoadedData = () => {
      if (videoRef.current !== video) {
        return;
      }

      setIsLoading(false);
      drawFrame();

      // 視覚効果 off のとき動画を自動再生しない
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setIsPlaying(false);
        video.pause();
      } else {
        setIsPlaying(true);
        void video.play().then(startDrawing).catch(() => {
          setIsPlaying(false);
        });
      }
    };

    const handlePlay = () => {
      startDrawing();
    };

    const handlePause = () => {
      stopDrawing();
      drawFrame();
    };

    const handleSeeked = () => {
      drawFrame();
    };

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("seeked", handleSeeked);

    return () => {
      stopDrawing();
      if (videoRef.current === video) {
        videoRef.current = null;
      }
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("seeked", handleSeeked);
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [src, drawFrame, startDrawing, stopDrawing]);

  const handleClick = useCallback(() => {
    const video = videoRef.current;
    if (isLoading || video === null) {
      return;
    }

    setIsPlaying((isPlaying) => {
      if (isPlaying) {
        video.pause();
      } else {
        void video.play().then(startDrawing).catch(() => {
          setIsPlaying(false);
        });
      }
      return !isPlaying;
    });
  }, [isLoading, startDrawing]);

  const hasMovie = !isLoading && videoRef.current !== null;

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        className={classNames("group relative block h-full w-full bg-cax-surface-subtle", {
          "animate-pulse": !hasMovie,
        })}
        onClick={handleClick}
        ref={buttonCallbackRef}
        type="button"
      >
        <canvas ref={canvasCallbackRef} className="w-full" />
        <div
          className={classNames(
            "absolute left-1/2 top-1/2 flex items-center justify-center w-16 h-16 text-cax-surface-raised text-3xl bg-cax-overlay/50 rounded-full -translate-x-1/2 -translate-y-1/2",
            {
              "opacity-0 group-hover:opacity-100": isPlaying && hasMovie,
            },
          )}
        >
          <FontAwesomeIcon iconType={isPlaying ? "pause" : "play"} styleType="solid" />
        </div>
      </button>
    </AspectRatioBox>
  );
};
