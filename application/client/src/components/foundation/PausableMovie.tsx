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
  const imgRef = useRef<HTMLImageElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const handleClick = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    if (isPlaying) {
      // GIF を一時停止するために src を空にして canvas に現在フレームを保持する
      img.style.visibility = "hidden";
      setIsPlaying(false);
    } else {
      img.style.visibility = "visible";
      // src を再設定して GIF を最初から再生する
      const currentSrc = img.src;
      img.src = "";
      img.src = currentSrc;
      setIsPlaying(true);
    }
  }, [isPlaying]);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full"
        onClick={handleClick}
        type="button"
      >
        <img
          ref={imgRef}
          alt=""
          className="h-full w-full object-cover"
          src={src}
        />
        <div
          className={`absolute left-1/2 top-1/2 flex items-center justify-center w-16 h-16 text-cax-surface-raised text-3xl bg-cax-overlay/50 rounded-full -translate-x-1/2 -translate-y-1/2 ${isPlaying ? "opacity-0 group-hover:opacity-100" : ""}`}
        >
          <FontAwesomeIcon iconType={isPlaying ? "pause" : "play"} styleType="solid" />
        </div>
      </button>
    </AspectRatioBox>
  );
};
