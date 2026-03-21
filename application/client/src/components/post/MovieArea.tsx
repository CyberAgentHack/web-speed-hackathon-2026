import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
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
      {isActive ? (
        <PausableMovie src={getMoviePath(movie.id)} />
      ) : (
        <AspectRatioBox aspectHeight={1} aspectWidth={1}>
          <button
            aria-label="動画プレイヤー"
            className="group relative block h-full w-full bg-cax-surface-subtle"
            type="button"
          >
            <div className="absolute left-1/2 top-1/2 flex items-center justify-center w-16 h-16 text-cax-surface-raised text-3xl bg-cax-overlay/50 rounded-full -translate-x-1/2 -translate-y-1/2">
              <FontAwesomeIcon iconType="play" styleType="solid" />
            </div>
          </button>
        </AspectRatioBox>
      )}
    </div>
  );
};
