import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 * GIF を `<img>` で表示し、一時停止時は canvas にフレームをキャプチャして表示します。
 */
export const PausableMovie = ({ src }: Props) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // IntersectionObserver: track visibility
  useEffect(() => {
    const target = placeholderRef.current ?? buttonRef.current;
    if (target == null) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry != null) {
          setIsVisible(entry.isIntersecting);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [isLoaded]);

  // Respect prefers-reduced-motion
  useEffect(() => {
    if (isLoaded && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      pauseGif();
      setIsPlaying(false);
    }
  }, [isLoaded]);

  const pauseGif = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (img == null || canvas == null) return;

    // Capture the current frame to canvas
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (ctx != null) {
      ctx.drawImage(img, 0, 0);
    }
    // Show canvas, hide img
    canvas.style.display = "block";
    img.style.display = "none";
  }, []);

  const resumeGif = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (img == null || canvas == null) return;

    // Re-trigger GIF animation by re-assigning src
    const currentSrc = img.src;
    img.src = "";
    img.src = currentSrc;

    // Show img, hide canvas
    img.style.display = "block";
    canvas.style.display = "none";
  }, []);

  const handleClick = useCallback(() => {
    setIsPlaying((prev) => {
      if (prev) {
        pauseGif();
      } else {
        resumeGif();
      }
      return !prev;
    });
  }, [pauseGif, resumeGif]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  if (!isVisible && !isLoaded) {
    // Render a placeholder that the IntersectionObserver can observe
    return (
      <AspectRatioBox aspectHeight={1} aspectWidth={1}>
        <div ref={placeholderRef} className="h-full w-full" />
      </AspectRatioBox>
    );
  }

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        ref={buttonRef}
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full"
        onClick={handleClick}
        type="button"
      >
        <img
          ref={imgRef}
          alt=""
          className="w-full"
          decoding="async"
          onLoad={handleLoad}
          src={src}
        />
        <canvas ref={canvasRef} className="w-full" style={{ display: "none" }} />
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
