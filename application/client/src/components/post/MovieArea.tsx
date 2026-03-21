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
      <video
        autoPlay={false}
        className="h-full w-full object-contain"
        controls
        height={1080}
        loop={false}
        muted={false}
        playsInline
        src={getMoviePath(movie.id)}
        width={1080}
      />
    </div>
  );
};
