import { PausableVideo } from "@web-speed-hackathon-2026/client/src/components/foundation/PausableVideo";
import { getMoviePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  movie: Models.Movie;
}

export const MovieArea = ({ movie }: Props) => {
  return (
    <div
      className="border-cax-border bg-cax-surface-subtle relative aspect-square w-full overflow-hidden rounded-lg border"
      data-movie-area
    >
      <PausableVideo src={getMoviePath(movie.id)} />
    </div>
  );
};
