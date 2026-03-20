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
  const videoRef = useRef<HTMLVideoElement>(null);
  const isAnimatedImage = src.endsWith(".gif") || src.endsWith(".webp");

  const [isPlaying, setIsPlaying] = useState(true);
  const handleClick = useCallback(() => {
    if (isAnimatedImage) return;
    setIsPlaying((isPlaying) => {
      if (isPlaying) {
        videoRef.current?.pause();
      } else {
        videoRef.current?.play();
      }
      return !isPlaying;
    });
  }, [isAnimatedImage]);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full"
        onClick={handleClick}
        type="button"
      >
        {isAnimatedImage ? (
          <img className="h-full w-full object-cover" loading="lazy" src={src} alt="" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
            src={src}
          />
        )}
        {!isAnimatedImage && (
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
        )}
      </button>
    </AspectRatioBox>
  );
};
