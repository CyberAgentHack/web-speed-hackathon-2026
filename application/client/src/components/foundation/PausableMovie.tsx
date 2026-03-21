import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
  loading?: "eager" | "lazy";
  disableClick?: boolean;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 * 再生中はネイティブの img で GIF を表示し、一時停止時だけ canvas に静止フレームを描画します。
 */
export const PausableMovie = ({ src, loading = "lazy", disableClick = false }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  const drawCurrentFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    setIsLoaded(false);
    setIsPlaying(true);
  }, [src]);

  const handleLoad = useCallback(() => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    setIsLoaded(true);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      drawCurrentFrame();
      setIsPlaying(false);
    }
  }, [drawCurrentFrame]);

  const handleClick = useCallback(() => {
    if (!isLoaded) return;
    setIsPlaying((prev) => {
      if (prev) {
        drawCurrentFrame();
      }
      return !prev;
    });
  }, [drawCurrentFrame, isLoaded]);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        className={classNames("group relative block h-full w-full", {
          "pointer-events-none": disableClick,
        })}
        onClick={handleClick}
        type="button"
      >
        <img
          ref={imageRef}
          alt=""
          className={classNames("absolute inset-0 h-full w-full object-cover", {
            hidden: !isPlaying,
          })}
          decoding="async"
          fetchPriority={loading === "eager" ? "high" : "low"}
          loading={loading}
          onLoad={handleLoad}
          src={src}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover"
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
