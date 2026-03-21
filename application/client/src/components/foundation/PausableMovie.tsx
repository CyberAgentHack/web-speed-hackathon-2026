import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { useInViewport } from "@web-speed-hackathon-2026/client/src/hooks/use_in_viewport";

interface Props {
  src: string;
  /** タイムラインでは article クリック遷移との干渉を避けるため、クリックを一時的に無効化する */
  delayInteraction?: boolean;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 * ビューポート付近に入るまでフェッチを遅延します。
 */
export const PausableMovie = ({ src, delayInteraction = false }: Props) => {
  const [containerRef, isInViewport] = useInViewport("200px");
  const videoRef = useRef<HTMLVideoElement>(null);

  // タイムラインではマウント後しばらくボタンのクリックを透過させる
  const [isInteractive, setIsInteractive] = useState(!delayInteraction);
  useEffect(() => {
    if (!delayInteraction) return;
    const id = setTimeout(() => setIsInteractive(true), 500);
    return () => clearTimeout(id);
  }, [delayInteraction]);

  // prefers-reduced-motion: 動きを減らす設定の場合は自動再生を止める
  const [isPlaying, setIsPlaying] = useState(true);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  }, [isInViewport]);

  const handleClick = useCallback(() => {
    setIsPlaying((isPlaying) => {
      if (isPlaying) {
        videoRef.current?.pause();
      } else {
        videoRef.current?.play();
      }
      return !isPlaying;
    });
  }, []);

  return (
    <div ref={containerRef} className="relative w-full" style={{ aspectRatio: "1 / 1" }}>
      <button
        aria-label="動画プレイヤー"
        className={classNames("group relative block h-full w-full", {
          "pointer-events-none": !isInteractive,
        })}
        onClick={handleClick}
        type="button"
      >
        {isInViewport ? (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="w-full"
            src={src}
          />
        ) : null}
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
    </div>
  );
};
