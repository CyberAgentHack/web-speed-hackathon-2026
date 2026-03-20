import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  priority?: boolean;
  src: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ priority = false, src }: Props) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(priority);

  useEffect(() => {
    if (priority) {
      setShouldLoad(true);
      return;
    }

    const trigger = triggerRef.current;
    if (trigger == null || shouldLoad) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [priority, shouldLoad]);

  useEffect(() => {
    if (!shouldLoad) {
      return;
    }

    const video = videoRef.current;
    if (video == null) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      setIsPlaying(false);
      return;
    }

    void video.play().then(
      () => {
        setIsPlaying(true);
      },
      () => {
        setIsPlaying(false);
      },
    );
  }, [shouldLoad, src]);

  const handleClick = useCallback(() => {
    if (!shouldLoad) {
      setShouldLoad(true);
      return;
    }

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
  }, [shouldLoad]);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full"
        onClick={handleClick}
        ref={triggerRef}
        type="button"
      >
        {shouldLoad ? (
          <video
            ref={videoRef}
            autoPlay
            className="h-full w-full object-cover"
            loop
            muted
            playsInline
            preload="metadata"
            src={src}
          />
        ) : (
          <div aria-hidden="true" className="h-full w-full bg-cax-surface-subtle" />
        )}
        <div
          className={classNames(
            "absolute left-1/2 top-1/2 flex h-16 w-16 items-center justify-center rounded-full bg-cax-overlay/50 text-3xl text-cax-surface-raised -translate-x-1/2 -translate-y-1/2",
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
