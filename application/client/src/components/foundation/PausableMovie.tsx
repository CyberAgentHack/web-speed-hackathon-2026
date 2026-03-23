import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  poster?: string;
  src: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ poster, src }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  // 動画が自動で再生されること - ユーザー操作または一定時間後に再生開始
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = () => {
      setShowVideo(true);
      cleanup();
    };
    const timer = setTimeout(start, 10000);
    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", start);
    };
    window.addEventListener("scroll", start, { passive: true, once: true });
    return cleanup;
  }, []);

  useEffect(() => {
    if (showVideo && videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [showVideo]);

  const handleClick = useCallback(() => {
    if (!showVideo) {
      setShowVideo(true);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, showVideo]);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full"
        onClick={handleClick}
        type="button"
      >
        {showVideo ? (
          <video
            ref={videoRef}
            className="w-full"
            loop
            muted
            playsInline
            poster={poster}
            src={src}
          />
        ) : (
          poster ? <img src={poster} alt="" className="w-full h-full object-cover" /> : null
        )}
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
