import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  poster?: string;
  prioritize?: boolean;
  src: string;
}

export const PausableVideo = ({ poster, prioritize = false, src }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const priorityProps = prioritize ? ({ fetchpriority: "high" } as Record<string, string>) : {};

  useEffect(() => {
    const video = videoRef.current;
    if (video == null) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      void video
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          setIsPlaying(false);
        });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [src]);

  const handleClick = useCallback(() => {
    const video = videoRef.current;
    if (video == null) {
      return;
    }

    setIsPlaying((current) => {
      if (current) {
        video.pause();
      } else {
        void video.play();
      }
      return !current;
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
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          loop
          muted
          poster={poster}
          preload={prioritize ? "auto" : "metadata"}
          playsInline
          src={src}
          {...priorityProps}
        />
        <div
          className={classNames(
            "absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-cax-overlay/50 text-3xl text-cax-surface-raised",
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
