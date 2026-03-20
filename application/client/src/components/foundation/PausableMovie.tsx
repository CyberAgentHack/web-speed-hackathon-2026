import { useCallback, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { useNearViewport } from "@web-speed-hackathon-2026/client/src/hooks/use_near_viewport";

interface Props {
  src: string;
}

const MOVIE_POSTER_DATA_URI =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ src }: Props) => {
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
    const movie = movieRef.current;
    if (!isMovieReady || movie == null) {
      return;
    }
    if (movie.paused) {
      void movie.play();
      return;
    }
    movie.pause();
  }, [isMovieReady]);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        className="relative block h-full w-full"
        onClick={handleClick}
        ref={targetRef}
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
          poster={MOVIE_POSTER_DATA_URI}
          playsInline={true}
          preload="auto"
          onLoadedMetadata={handleLoadMovie}
          src={isNearViewport ? src : undefined}
        />
      </button>
    </AspectRatioBox>
  );
};
