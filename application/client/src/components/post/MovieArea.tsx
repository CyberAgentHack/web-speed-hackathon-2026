import { lazy, Suspense } from "react";

const PausableMovie = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/components/foundation/PausableMovie").then(
    (m) => ({ default: m.PausableMovie }),
  ),
);
import { getMoviePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  movie: Models.Movie;
}

export const MovieArea = ({ movie }: Props) => {
  return (
    <div
      className="border-cax-border bg-cax-surface-subtle relative h-full w-full overflow-hidden rounded-lg border"
      data-movie-area
    >
      <Suspense>
        <PausableMovie src={getMoviePath(movie.id)} />
      </Suspense>
    </div>
  );
};
