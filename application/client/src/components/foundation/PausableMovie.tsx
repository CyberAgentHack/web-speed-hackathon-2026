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
  const [isPlaying, setIsPlaying] = useState(
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawSnapshot = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (img && canvas && img.complete) {
      canvas.width = img.clientWidth || img.naturalWidth || 500;
      canvas.height = img.clientHeight || img.naturalHeight || 500;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillRect(0, 0, canvas.width, canvas.height); // 透過対策
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const handleClick = useCallback(() => {
    setIsPlaying((playing) => {
      const nextPlaying = !playing;
      if (!nextPlaying) {
        drawSnapshot();
      }
      return nextPlaying;
    });
  }, [drawSnapshot]);

  useEffect(() => {
    if (!isPlaying) {
      drawSnapshot();
    }
  }, [isPlaying, drawSnapshot]);

  const handleImageLoad = useCallback(() => {
    if (!isPlaying) {
      drawSnapshot();
    }
  }, [isPlaying, drawSnapshot]);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full bg-cax-surface-subtle"
        onClick={handleClick}
        type="button"
      >
        <img
          ref={imgRef}
          src={src}
          className={classNames("h-full w-full object-cover", {
            block: isPlaying,
            hidden: !isPlaying,
          })}
          loading="lazy"
          decoding="async"
          onLoad={handleImageLoad}
          alt=""
        />
        <canvas
          ref={canvasRef}
          className={classNames("h-full w-full object-cover", {
            block: !isPlaying,
            hidden: isPlaying,
          })}
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
