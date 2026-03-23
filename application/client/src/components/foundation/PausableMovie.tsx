import classNames from "classnames";
import { useCallback, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ src }: Props) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const captureCurrentFrame = useCallback(() => {
    // rAF でブラウザの描画サイクルに合わせてからキャプチャする
    requestAnimationFrame(() => {
      const img = imgRef.current;
      const canvas = canvasRef.current;
      if (img && canvas) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d")?.drawImage(img, 0, 0);
      }
      setIsPlaying(false);
    });
  }, []);

  const handleImgLoad = useCallback(() => {
    // 視覚効果 off のとき GIF を自動再生しない
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      captureCurrentFrame();
    }
  }, [captureCurrentFrame]);

  const handleClick = useCallback(() => {
    if (isPlaying) {
      captureCurrentFrame();
    } else {
      setIsPlaying(true);
    }
  }, [isPlaying, captureCurrentFrame]);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full"
        onClick={handleClick}
        type="button"
      >
        {/*
         * img は display:none にしない。
         * display:none にするとブラウザが GIF アニメーションを停止・リセットし、
         * 再表示時に frame 0 から再スタートしてしまうため。
         * 代わりに canvas を absolute で上に被せてポーズ表示する。
         */}
        <img ref={imgRef} src={src} alt="" className="w-full" onLoad={handleImgLoad} />
        {/* 一時停止中: キャプチャしたフレームを img の上に被せて表示 */}
        <canvas
          ref={canvasRef}
          className={classNames("absolute inset-0 w-full h-full", { hidden: isPlaying })}
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
