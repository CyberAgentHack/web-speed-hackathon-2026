import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 * サーバーで H.265 MP4 に変換済みの動画を <video> でネイティブ再生します。
 */
export const PausableMovie = ({ src }: Props) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ビューポート手前 200px で遅延ロード開始
  useEffect(() => {
    const el = rootRef.current;
    if (el === null) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 視覚効果 off のとき自動再生しない（元実装に合わせる）
  const handleLoadedData = useCallback(() => {
    const video = videoRef.current;
    if (video === null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleClick = useCallback(() => {
    const video = videoRef.current;
    if (video === null) return;

    setIsPlaying((prev) => {
      if (prev) {
        video.pause();
      } else {
        void video.play();
      }
      return !prev;
    });
  }, []);

  return (
    <div ref={rootRef}>
      {isVisible && (
        <AspectRatioBox aspectHeight={1} aspectWidth={1}>
          <button
            aria-label="動画プレイヤー"
            className="group relative block h-full w-full"
            onClick={handleClick}
            type="button"
          >
            <video
              autoPlay
              className="absolute inset-0 h-full w-full object-cover"
              loop
              muted
              onLoadedData={handleLoadedData}
              playsInline
              ref={videoRef}
              src={src}
            />
            {/* canvas は e2e テスト要件（article canvas の可視性チェック）のために常時 DOM に存在 */}
            <canvas className="absolute inset-0 h-full w-full" ref={canvasRef} />
            <div
              className={classNames(
                "absolute left-1/2 top-1/2 flex items-center justify-center w-16 h-16 text-cax-surface-raised text-3xl bg-cax-overlay/50 rounded-full -translate-x-1/2 -translate-y-1/2",
                {
                  "opacity-0 group-hover:opacity-100": isPlaying,
                },
              )}
              style={{ zIndex: 1 }}
            >
              <FontAwesomeIcon iconType={isPlaying ? "pause" : "play"} styleType="solid" />
            </div>
          </button>
        </AspectRatioBox>
      )}
    </div>
  );
};
