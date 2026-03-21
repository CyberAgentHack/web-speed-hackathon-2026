import { useMemo } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { PausableMovie } from "@web-speed-hackathon-2026/client/src/components/foundation/PausableMovie";
import { useIntersectionObserver } from "@web-speed-hackathon-2026/client/src/hooks/use_intersection_observer";
import { getMoviePath, getMoviePosterPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

const OBSERVER_OPTIONS: IntersectionObserverInit = { rootMargin: "200px" };

interface Props {
  movie: Models.Movie;
  priority?: boolean;
}

export const MovieArea = ({ movie, priority }: Props) => {
  const [ref, isVisible] = useIntersectionObserver(OBSERVER_OPTIONS);
  const src = useMemo(() => getMoviePath(movie.id), [movie.id]);
  const posterSrc = useMemo(() => getMoviePosterPath(movie.id), [movie.id]);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <div
        ref={ref}
        className="border-cax-border bg-cax-surface-subtle relative h-full w-full overflow-hidden rounded-lg border"
        data-movie-area
      >
        {isVisible ? <PausableMovie src={src} poster={posterSrc} /> : null}
        {!isVisible && priority ? (
          <img
            alt=""
            className="absolute top-1/2 left-1/2 h-full w-full max-w-none -translate-x-1/2 -translate-y-1/2 object-cover"
            fetchPriority="high"
            src={posterSrc}
          />
        ) : null}
      </div>
    </AspectRatioBox>
  );
};
