import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ src }: Props) => {
  const videoElemRef = useRef<HTMLVideoElement>(null);

  // useEffect(() => {
  //   if (videoElemRef.current === null) {
  //     return;
  //   }

  //   const video = videoElemRef.current;

  //   const observer = new IntersectionObserver((targetsList) => {
  //     if(targetsList == null || targetsList.length !== 1) {
  //       console.info(targetsList);
  //       throw new Error("Expected to only receive one dir div[ref=lastRef] but it wasn't");
  //     }

  //     // 視覚効果 off のとき GIF を自動再生しない
  //     if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  //       setIsPlaying(false);
  //     } else {
  //       setIsPlaying(true);
  //       video.play();
  //     }
  //   });

  //   observer.observe(videoElemRef.current);

  //   return () => {
  //     return 
  //   };
  // }, []);

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
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full"
        onClick={handleClick}
        type="button"
      >
        <video ref={videoElemRef} className="w-full h-full" muted loop autoPlay={window.matchMedia("(prefers-reduced-motion: reduce)").matches}>
          <source src={src} />
        </video>
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
