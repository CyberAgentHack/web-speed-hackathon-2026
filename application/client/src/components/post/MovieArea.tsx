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
      <video src={getMoviePath(movie.id)} controls autoPlay={false} loop={false} muted={false} playsInline  style={{ width: '100%', height: 'auto' }} />
    </div>
  );
};
