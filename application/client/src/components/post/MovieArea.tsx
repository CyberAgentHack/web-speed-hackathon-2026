import { PausableMovie } from "@web-speed-hackathon-2026/client/src/components/foundation/PausableMovie";
import { useActivateOnceVisible } from "@web-speed-hackathon-2026/client/src/hooks/use_activate_once_visible";
import { getMoviePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  movie: Models.Movie;
}

export const MovieArea = ({ movie }: Props) => {
  const { isActive, targetRef } = useActivateOnceVisible<HTMLDivElement>();

  return (
    <div
      className="border-cax-border bg-cax-surface-subtle relative h-full w-full overflow-hidden rounded-lg border"
      data-movie-area
      ref={targetRef}
    >
      {isActive ? <PausableMovie src={getMoviePath(movie.id)} /> : null}
    </div>
  );
};
