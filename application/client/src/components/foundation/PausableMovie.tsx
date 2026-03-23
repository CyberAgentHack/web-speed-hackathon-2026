import classNames from "classnames";
import { useCallback, useRef, useState } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
}

/**
 * MP4を<video>で再生し、クリックで一時停止/再生を切り替えます。
 * CSS aspect-ratioでレイアウトシフトを防止。
 */
export const PausableMovie = ({ src }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // prefers-reduced-motion対応
  const prefersReducedMotion = typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const handleClick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    setIsPlaying((playing) => {
      if (playing) {
        // 一時停止: 現在のフレームをcanvasにキャプチャ
        if (video && canvas) {
          canvas.width = video.videoWidth || video.clientWidth;
          canvas.height = video.videoHeight || video.clientHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
        }
        video?.pause();
      } else {
        video?.play();
      }
      return !playing;
    });
  }, []);

  const showVideo = isPlaying && !prefersReducedMotion;

  return (
    <div className="relative w-full" style={{ aspectRatio: "1 / 1" }}>
      <button
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full"
        onClick={handleClick}
        type="button"
      >
        {/* 再生中: <video>でMP4再生 */}
        <video
          ref={videoRef}
          autoPlay
          className="w-full"
          loop
          muted
          playsInline
          src={src}
          style={{ display: showVideo ? "block" : "none" }}
        />
        {/* 一時停止中: canvasで静止フレーム表示 */}
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ display: showVideo ? "none" : "block" }}
        />
        <div
          className={classNames(
            "absolute left-1/2 top-1/2 flex items-center justify-center w-16 h-16 text-cax-surface-raised text-3xl bg-cax-overlay/50 rounded-full -translate-x-1/2 -translate-y-1/2",
            {
              "opacity-0 group-hover:opacity-100": showVideo,
            },
          )}
        >
          <FontAwesomeIcon iconType={showVideo ? "pause" : "play"} styleType="solid" />
        </div>
      </button>
    </div>
  );
};
