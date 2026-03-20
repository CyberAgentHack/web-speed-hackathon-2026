import classNames from "classnames";
import { useCallback, useEffect, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  posterSrc: string;
  src: string;
}

/**
 * 初回描画は軽い poster を表示し、クリック後にだけ GIF を読み込みます。
 * 停止時は poster に戻して、初回表示のネットワーク負荷を抑えます。
 */
export const PausableMovie = ({ posterSrc, src }: Props) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [displayPosterSrc, setDisplayPosterSrc] = useState(posterSrc);

  useEffect(() => {
    setDisplayPosterSrc(posterSrc);
  }, [posterSrc]);

  const handleClick = useCallback(() => {
    setIsPlaying((current) => !current);
  }, []);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label={isPlaying ? "動画を停止" : "動画を再生"}
        aria-pressed={isPlaying}
        className="group relative block h-full w-full"
        onClick={handleClick}
        type="button"
      >
        <img
          alt=""
          className="h-full w-full object-cover"
          decoding="async"
          loading="lazy"
          onError={() => {
            if (displayPosterSrc !== src) {
              setDisplayPosterSrc(src);
            }
          }}
          src={isPlaying ? src : displayPosterSrc}
        />

        <div
          className={classNames(
            "absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-cax-overlay/50 text-3xl text-cax-surface-raised",
            {
              "opacity-100": !isPlaying,
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
