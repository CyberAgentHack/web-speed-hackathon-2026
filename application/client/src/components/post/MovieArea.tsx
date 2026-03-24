import { PausableMovie } from "@web-speed-hackathon-2026/client/src/components/foundation/PausableMovie";
import { getMoviePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  movie: Models.Movie;
  fetchPriority?: "high" | "low" | "auto";
}

export const MovieArea = ({ movie, fetchPriority = "auto" }: Props) => {
  return (
    <div
      className="border-cax-border bg-cax-surface-subtle relative h-full w-full overflow-hidden rounded-lg border"
      data-movie-area
    >
      <PausableMovie src={getMoviePath(movie.id)} width={1080} height={1080} fetchPriority={fetchPriority} />
    </div>
  );
};
