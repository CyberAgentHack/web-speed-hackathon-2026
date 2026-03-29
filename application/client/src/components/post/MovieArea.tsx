import { PausableMovie } from "@web-speed-hackathon-2026/client/src/components/foundation/PausableMovie";
import { getMoviePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  movie: Models.Movie;
  isPriority?: boolean;
}

export const MovieArea = ({ movie, isPriority }: Props) => {
  return (
    <div
      className="border-cax-border bg-cax-surface-subtle relative w-full overflow-hidden rounded-lg border"
      data-movie-area
      style={{ maxHeight: '60vh' }}
    >
      <PausableMovie src={getMoviePath(movie.id)} isPriority={isPriority} />
    </div>
  );
};
