import { lazy, Suspense } from "react";

import { getMoviePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

const PausableMovie = lazy(async () => {
  const mod = await import("@web-speed-hackathon-2026/client/src/components/foundation/PausableMovie");
  return { default: mod.PausableMovie };
});

interface Props {
  movie: Models.Movie;
}

export const MovieArea = ({ movie }: Props) => {
  return (
    <div
      className="border-cax-border bg-cax-surface-subtle relative h-full w-full overflow-hidden rounded-lg border"
      data-movie-area
    >
      <Suspense fallback={null}>
        <PausableMovie src={getMoviePath(movie.id)} />
      </Suspense>
    </div>
  );
};
