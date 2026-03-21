import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  autoPlayInViewport?: boolean;
  eager?: boolean;
  posterSrc: string;
  src: string;
}

/**
 * 初回描画は軽い poster を表示し、クリック後にだけ GIF を読み込みます。
 * 停止時は poster に戻して、初回表示のネットワーク負荷を抑えます。
 */
export const PausableMovie = ({
  autoPlayInViewport = false,
  eager = false,
  posterSrc,
  src,
}: Props) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [displayPosterSrc, setDisplayPosterSrc] = useState(posterSrc);

  useEffect(() => {
    setDisplayPosterSrc(posterSrc);
  }, [posterSrc]);

  useEffect(() => {
    setIsPausedByUser(false);
  }, [src]);

  useEffect(() => {
    if (!autoPlayInViewport) {
      setIsVisible(false);
      return;
    }

    const element = buttonRef.current;
    if (element === null) {
      return;
    }

    const updateVisibility = () => {
      const rect = element.getBoundingClientRect();
      setIsVisible(rect.bottom > 0 && rect.top < window.innerHeight);
    };

    updateVisibility();

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry?.isIntersecting === true);
      },
      {
        threshold: 0.01,
      },
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [autoPlayInViewport]);

  useEffect(() => {
    if (!autoPlayInViewport) {
      return;
    }

    setIsPlaying(isVisible && !isPausedByUser);
  }, [autoPlayInViewport, isPausedByUser, isVisible]);

  const handleClick = useCallback(() => {
    setIsPlaying((current) => {
      const nextIsPlaying = !current;
      if (autoPlayInViewport) {
        setIsPausedByUser(!nextIsPlaying);
      }
      return nextIsPlaying;
    });
  }, [autoPlayInViewport]);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        aria-pressed={isPlaying}
        className="group relative block h-full w-full"
        onClick={handleClick}
        ref={buttonRef}
        type="button"
      >
        <img
          alt=""
          className="h-full w-full object-cover"
          decoding="async"
          fetchPriority={eager ? "high" : "auto"}
          loading={eager ? "eager" : "lazy"}
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
