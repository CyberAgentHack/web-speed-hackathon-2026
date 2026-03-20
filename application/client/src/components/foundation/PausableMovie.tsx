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
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLButtonElement>(null);
  const wasPausedManuallyRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  useEffect(() => {
    const element = wrapperRef.current;
    if (element == null) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setIsVisible(entries.some((entry) => entry.isIntersecting));
      },
      {
        threshold: 0.5,
      },
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video == null) {
      return;
    }

    if (prefersReducedMotion || !isVisible) {
      video.pause();
      setIsPlaying(false);
      return;
    }

    if (wasPausedManuallyRef.current) {
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
  }, [isVisible, prefersReducedMotion, src]);

  const handleClick = useCallback(() => {
    const video = videoRef.current;
    if (video == null) {
      return;
    }

    if (video.paused) {
      wasPausedManuallyRef.current = false;
      void video.play().then(
        () => {
          setIsPlaying(true);
        },
        () => {
          setIsPlaying(false);
        },
      );
      return;
    }

    wasPausedManuallyRef.current = true;
    video.pause();
    setIsPlaying(false);
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        ref={wrapperRef}
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full"
        onClick={handleClick}
        type="button"
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          disablePictureInPicture={true}
          loop={true}
          muted={true}
          onPause={handlePause}
          onPlay={handlePlay}
          playsInline={true}
          preload="metadata"
          src={src}
        />
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
