import { useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";

interface Props {
  src: string;
  priority?: boolean;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ src, priority = false }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(priority);

  useEffect(() => {
    if (priority) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [priority]);

  return (
    <div ref={containerRef}>
      <AspectRatioBox aspectHeight={1} aspectWidth={1}>
        {isVisible ? (
          <button
            aria-label="動画プレイヤー"
            className="block h-full w-full"
            type="button"
          >
            <img
              src={src}
              alt=""
              className="h-full w-full object-cover"
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
            />
          </button>
        ) : null}
      </AspectRatioBox>
    </div>
  );
};
