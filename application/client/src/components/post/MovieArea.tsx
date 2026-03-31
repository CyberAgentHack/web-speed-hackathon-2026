import { PausableMovie } from "@web-speed-hackathon-2026/client/src/components/foundation/PausableMovie";
import { getMoviePath, getMoviePosterPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";
import { getMovieAspectRatio } from "@web-speed-hackathon-2026/client/src/utils/media_aspect_ratio";

interface Props {
  movie: Models.Movie;
  prioritizeLoad?: boolean;
}

export const MovieArea = ({ movie, prioritizeLoad = false }: Props) => {
  const { aspectHeight, aspectWidth } = getMovieAspectRatio(movie);

  return (
    <div
      className="border-cax-border bg-cax-surface-subtle relative h-full w-full overflow-hidden rounded-lg border"
      data-movie-area
    >
      <PausableMovie
        aspectHeight={aspectHeight}
        aspectWidth={aspectWidth}
        deferMount={!prioritizeLoad}
        poster={getMoviePosterPath(movie.id)}
        preload={prioritizeLoad ? "auto" : "metadata"}
        prioritizePoster={prioritizeLoad}
        src={getMoviePath(movie.id)}
      />
    </div>
  );
};
