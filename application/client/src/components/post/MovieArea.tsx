import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { PausableMovie } from "@web-speed-hackathon-2026/client/src/components/foundation/PausableMovie";
import { useInViewOnce } from "@web-speed-hackathon-2026/client/src/hooks/use_in_view_once";
import { getMoviePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

const IN_VIEW_OPTIONS: IntersectionObserverInit = { rootMargin: "200px 0px" };

interface Props {
  movie: Models.Movie;
}

export const MovieArea = ({ movie }: Props) => {
  const [ref, isInView] = useInViewOnce<HTMLDivElement>(IN_VIEW_OPTIONS);
  const shouldLoad = isInView;

  return (
    <div
      ref={ref}
      className="border-cax-border bg-cax-surface-subtle relative h-full w-full overflow-hidden rounded-lg border"
      data-movie-area
    >
      {shouldLoad ? (
        <PausableMovie src={getMoviePath(movie.id)} />
      ) : (
        <AspectRatioBox aspectHeight={1} aspectWidth={1}>
          <div className="h-full w-full animate-pulse" />
        </AspectRatioBox>
      )}
    </div>
  );
};
