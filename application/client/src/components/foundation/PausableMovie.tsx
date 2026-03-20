import classNames from "classnames";
import { useCallback, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
}

/**
 * GIFを<img>でネイティブ再生し、クリックで一時停止/再生を切り替えます。
 * gifler/omggifを使わずブラウザのGIF再生機能を利用（TBT改善）。
 */
export const PausableMovie = ({ src }: Props) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // prefers-reduced-motion対応
  const prefersReducedMotion = typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const handleClick = useCallback(() => {
    setIsPlaying((playing) => {
      if (playing) {
        // 一時停止: 現在のフレームをcanvasにキャプチャ
        const img = imgRef.current;
        const canvas = canvasRef.current;
        if (img && canvas) {
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
        }
      }
      return !playing;
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
        {/* 再生中: <img>でブラウザネイティブGIF再生 */}
        <img
          ref={imgRef}
          className="w-full"
          src={src}
          style={{ display: (isPlaying && !prefersReducedMotion) ? "block" : "none" }}
        />
        {/* 一時停止中: canvasで静止フレーム表示 */}
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ display: (isPlaying && !prefersReducedMotion) ? "none" : "block" }}
        />
        <div
          className={classNames(
            "absolute left-1/2 top-1/2 flex items-center justify-center w-16 h-16 text-cax-surface-raised text-3xl bg-cax-overlay/50 rounded-full -translate-x-1/2 -translate-y-1/2",
            {
              "opacity-0 group-hover:opacity-100": isPlaying && !prefersReducedMotion,
            },
          )}
        >
          <FontAwesomeIcon iconType={(isPlaying && !prefersReducedMotion) ? "pause" : "play"} styleType="solid" />
        </div>
      </button>
    </AspectRatioBox>
  );
};
