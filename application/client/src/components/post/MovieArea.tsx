import { PausableVideo } from "@web-speed-hackathon-2026/client/src/components/foundation/PausableVideo";
import { getMoviePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  movie: Models.Movie;
  deferInitialLoad?: boolean;
  poster?: string;
}

export const MovieArea = ({ movie, deferInitialLoad = false, poster }: Props) => {
  return (
    <div
      className="border-cax-border bg-cax-surface-subtle relative aspect-square w-full overflow-hidden rounded-lg border"
      data-movie-area
    >
      <PausableVideo src={getMoviePath(movie.id)} deferInitialLoad={deferInitialLoad} poster={poster} />
    </div>
  );
};
