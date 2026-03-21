import { PausableMovie } from "@web-speed-hackathon-2026/client/src/components/foundation/PausableMovie";
import { getMoviePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  movie: Models.Movie;
  loading?: "eager" | "lazy";
  disableClick?: boolean;
}

export const MovieArea = ({ movie, loading = "lazy", disableClick = false }: Props) => {
  return (
    <div
      className="border-cax-border bg-cax-surface-subtle relative h-full w-full overflow-hidden rounded-lg border"
      data-movie-area
    >
      <PausableMovie src={getMoviePath(movie.id)} loading={loading} disableClick={disableClick} />
    </div>
  );
};
