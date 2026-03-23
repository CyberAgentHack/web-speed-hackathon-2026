import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";
import { getMoviePath, getMoviePreviewPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  movieId: string;
  isFull?: boolean;
}

/**
 * 動画を MP4 最適化して表示します。
 * 画面内に入った時だけ読み込みと再生を開始する（Lazy Loading）ことで、
 * 詳細ページ等で画面外の動画が帯域を消費するのを防ぎます。
 */
export const PausableMovie = ({ movieId, isFull = false }: Props) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const src = isFull ? getMoviePath(movieId) : getMoviePreviewPath(movieId);

  // 画面内に入ったかどうかを監視
  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          // 一度画面に入ったら読み込みを開始するので、監視を終了して良い
          observer.unobserve(target);
        }
      },
      { rootMargin: "200px" } // 画面に入る少し前から準備開始
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-cax-surface-subtle"
      style={{ aspectRatio: "1 / 1" }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-cax-surface-subtle" />
      )}
      
      {/* 画面内に入った時だけ video タグを生成する */}
      {isInView && (
        <video
          key={src}
          autoPlay
          className={classNames("h-full w-full object-cover transition-opacity duration-300", {
            "opacity-0": !isLoaded,
            "opacity-100": isLoaded,
          })}
          loop
          muted
          onLoadedData={handleLoad}
          playsInline
          src={src}
        />
      )}
    </div>
  );
};
