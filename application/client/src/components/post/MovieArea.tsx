import { PausableMovie } from "@web-speed-hackathon-2026/client/src/components/foundation/PausableMovie";
import {
  getMoviePosterPath,
  getMovieSources,
} from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  interactive?: boolean;
  movie: Models.Movie;
  priority?: boolean;
}

export const MovieArea = ({ interactive = true, movie, priority = false }: Props) => {
  return (
    <div
      className="border-cax-border bg-cax-surface-subtle relative h-full w-full overflow-hidden rounded-lg border"
      data-movie-area
    >
      <PausableMovie
        interactive={interactive}
        posterSrc={getMoviePosterPath(movie.id)}
        prioritizeLoad={priority}
        sources={getMovieSources(movie.id)}
      />
    </div>
  );
};
