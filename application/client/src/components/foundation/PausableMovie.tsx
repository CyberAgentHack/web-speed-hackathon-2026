import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 * ブラウザネイティブの Image で GIF を読み込み、canvas に描画します。
 */
export const PausableMovie = ({ src }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const rafIdRef = useRef<number>(0);
  const isAnimatingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(true);

  const startLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    isAnimatingRef.current = true;
    const draw = () => {
      if (!isAnimatingRef.current) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      rafIdRef.current = requestAnimationFrame(draw);
    };
    rafIdRef.current = requestAnimationFrame(draw);
  }, []);

  const stopLoop = useCallback(() => {
    isAnimatingRef.current = false;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = 0;
    }
  }, []);

  useEffect(() => {
    const img = new Image();
    imgRef.current = img;

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        startLoop();
      }
    };

    img.src = src;

    return () => {
      stopLoop();
      img.onload = null;
      imgRef.current = null;
    };
  }, [src, startLoop, stopLoop]);

  const handleClick = useCallback(() => {
    setIsPlaying((prev) => {
      if (prev) {
        stopLoop();
      } else {
        startLoop();
      }
      return !prev;
    });
  }, [startLoop, stopLoop]);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
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
    </AspectRatioBox>
  );
};
