import classNames from "classnames";
import { Animator, Decoder } from "gifler";
import { GifReader } from "omggif";
import { RefCallback, useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  src: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ src }: Props) => {
  const videoElemRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoElemRef.current === null) {
      return;
    }

    // 視覚効果 off のとき GIF を自動再生しない
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      videoElemRef.current.play();
    }
  }, []);

  const [isPlaying, setIsPlaying] = useState(true);
  const handleClick = useCallback(() => {
    if (videoElemRef.current === null) {
      return;
    }
    const videoElem = videoElemRef.current;

    setIsPlaying((isPlaying) => {
      if (isPlaying) {
        videoElem.pause();
      } else {
        videoElem.play();
      }
      return !isPlaying;
    });
  }, []);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-labvideoElemRef="動画プレイヤー"
        className="group rvideoElemRefative block h-full w-full"
        onClick={handleClick}
        type="button"
      >
        <video ref={videoElemRef} src={src} className="w-full" />
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
