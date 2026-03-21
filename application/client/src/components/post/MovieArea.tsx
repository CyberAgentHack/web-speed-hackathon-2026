import { PausableMovie } from "@web-speed-hackathon-2026/client/src/components/foundation/PausableMovie";
import {
  getMoviePath,
  getMoviePosterPath,
} from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  autoPlayInViewport?: boolean;
  movie: Models.Movie;
  eager?: boolean;
}

export const MovieArea = ({ autoPlayInViewport = false, eager = false, movie }: Props) => {
  return (
    <div
      className="border-cax-border bg-cax-surface-subtle relative h-full w-full overflow-hidden rounded-lg border"
      data-movie-area
    >
      <PausableMovie
        autoPlayInViewport={autoPlayInViewport}
        eager={eager}
        posterSrc={getMoviePosterPath(movie.id)}
        src={getMoviePath(movie.id)}
      />
    </div>
  );
};
