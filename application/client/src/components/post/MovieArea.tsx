import { PausableMovie } from "@web-speed-hackathon-2026/client/src/components/foundation/PausableMovie";
import { getMoviePath, getMoviePosterPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  movie: Models.Movie;
  isLCP?: boolean;
}

export const MovieArea = ({ movie, isLCP }: Props) => {
  return (
    <div
      className="border-cax-border bg-cax-surface-subtle relative h-full w-full overflow-hidden rounded-lg border"
      data-movie-area
    >
      <PausableMovie src={getMoviePath(movie.id)} poster={getMoviePosterPath(movie.id)} isLCP={isLCP} />
    </div>
  );
};
