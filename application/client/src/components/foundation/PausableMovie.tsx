import { useCallback, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { useNearViewport } from "@web-speed-hackathon-2026/client/src/hooks/use_near_viewport";
import { MediaSource } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  interactive?: boolean;
  posterSrc?: string;
  prioritizeLoad?: boolean;
  sources: MediaSource[];
}

const MOVIE_POSTER_DATA_URI =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({
  interactive = true,
  posterSrc,
  prioritizeLoad = false,
  sources,
}: Props) => {
  const movieRef = useRef<HTMLVideoElement>(null);
  const readyCanvasRef = useRef<HTMLCanvasElement>(null);
  const { isNearViewport, targetRef } = useNearViewport<HTMLButtonElement>({
    rootMargin: "0px 0px",
  });
  const handleLoadMovie = useCallback(() => {
    const movie = movieRef.current;
    const canvas = readyCanvasRef.current;
    if (movie == null || canvas == null) {
      return;
    }
    canvas.width = movie.videoWidth;
    canvas.height = movie.videoHeight;
    setIsMovieReady(true);
  }, []);

  const [isMovieReady, setIsMovieReady] = useState(false);
  const handleClick = useCallback(() => {
    if (!interactive) {
      return;
    }

    const movie = movieRef.current;
    if (!isMovieReady || movie == null) {
      return;
    }
    if (movie.paused) {
      void movie.play();
      return;
    }
    movie.pause();
  }, [interactive, isMovieReady]);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        className="relative block h-full w-full"
        onClick={handleClick}
        ref={targetRef}
        tabIndex={interactive ? undefined : -1}
        type="button"
      >
        <canvas
          ref={readyCanvasRef}
          aria-hidden={true}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        />
        <video
          ref={movieRef}
          autoPlay={true}
          className="h-full w-full object-cover"
          loop={true}
          muted={true}
          poster={posterSrc ?? MOVIE_POSTER_DATA_URI}
          playsInline={true}
          preload={prioritizeLoad ? "metadata" : "none"}
          onLoadedMetadata={handleLoadMovie}
        >
          {isNearViewport
            ? sources.map((source) => {
                return <source key={source.src} src={source.src} type={source.type} />;
              })
            : null}
        </video>
      </button>
    </AspectRatioBox>
  );
};
