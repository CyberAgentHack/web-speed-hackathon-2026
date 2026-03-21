import { getMoviePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  movie: Models.Movie;
}

export const TimelineMovieArea = ({ movie }: Props) => {
  return (
    <div
      className="border-cax-border bg-cax-surface-subtle relative w-full overflow-hidden rounded-lg border"
      data-movie-area
      style={{ aspectRatio: "1 / 1" }}
    >
      <img
        src={getMoviePath(movie.id)}
        alt=""
        className="h-full w-full object-cover"
        decoding="async"
      />
    </div>
  );
};
