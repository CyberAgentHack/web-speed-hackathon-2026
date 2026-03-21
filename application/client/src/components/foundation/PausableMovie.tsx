import { RefCallback, useCallback, useEffect, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
}

/**
 * ビューポートに入ったら GIF を読み込みます。
 */
export const PausableMovie = ({ src }: Props) => {
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [useImageFallback, setUseImageFallback] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const containerCallbackRef = useCallback<RefCallback<HTMLDivElement>>((el) => {
    setContainerElement(el);
  }, []);

  useEffect(() => {
    if (containerElement === null) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry?.isIntersecting === true);
      },
      {
        root: null,
        rootMargin: "256px 0px",
      },
    );
    observer.observe(containerElement);

    return () => {
      observer.disconnect();
    };
  }, [containerElement]);

  useEffect(() => {
    if (isVisible) {
      setShouldLoad(true);
    }
  }, [isVisible]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const onChange = (ev: MediaQueryListEvent) => {
      setPrefersReducedMotion(ev.matches);
    };
    mediaQuery.addEventListener("change", onChange);

    return () => {
      mediaQuery.removeEventListener("change", onChange);
    };
  }, []);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <div className="relative block h-full w-full" ref={containerCallbackRef}>
        {shouldLoad ? (
          useImageFallback ? (
            <img
              alt="投稿動画"
              className="h-full w-full object-cover"
              decoding="async"
              loading="lazy"
              src={src}
            />
          ) : (
            <video
              aria-label="投稿動画"
              autoPlay={!prefersReducedMotion}
              className="h-full w-full object-cover"
              loop
              muted
              onError={() => setUseImageFallback(true)}
              playsInline
              preload="metadata"
              src={src}
            />
          )
        ) : (
          <div className="text-cax-text-muted absolute inset-0 flex items-center justify-center">
            <FontAwesomeIcon iconType="video" styleType="solid" />
          </div>
        )}
      </div>
    </AspectRatioBox>
  );
};
