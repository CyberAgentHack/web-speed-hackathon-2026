import { useMemo } from "react";

import { PausableMovie } from "@web-speed-hackathon-2026/client/src/components/foundation/PausableMovie";
import { useIntersectionObserver } from "@web-speed-hackathon-2026/client/src/hooks/use_intersection_observer";
import { getMoviePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

const OBSERVER_OPTIONS: IntersectionObserverInit = { rootMargin: "200px" };

interface Props {
  movie: Models.Movie;
}

export const MovieArea = ({ movie }: Props) => {
  const [ref, isVisible] = useIntersectionObserver(OBSERVER_OPTIONS);
  const src = useMemo(() => getMoviePath(movie.id), [movie.id]);

  return (
    <div
      ref={ref}
      className="border-cax-border bg-cax-surface-subtle relative h-full w-full overflow-hidden rounded-lg border"
      data-movie-area
    >
      {isVisible ? <PausableMovie src={src} /> : null}
    </div>
  );
};
