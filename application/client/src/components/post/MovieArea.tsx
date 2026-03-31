import { lazy, Suspense } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { MediaPlaceholder } from "@web-speed-hackathon-2026/client/src/components/foundation/MediaPlaceholder";
import { useNearScreen } from "@web-speed-hackathon-2026/client/src/hooks/use_near_screen";
import { getMoviePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

const PausableMovie = lazy(async () => {
  const mod = await import("@web-speed-hackathon-2026/client/src/components/foundation/PausableMovie");
  return { default: mod.PausableMovie };
});

interface Props {
  movie: Models.Movie;
  interactive?: boolean;
}

export const MovieArea = ({ movie, interactive = true }: Props) => {
  const { isNearScreen, ref } = useNearScreen<HTMLDivElement>({ rootMargin: "400px 0px" });

  return (
    <div
      className={`border-cax-border bg-cax-surface-subtle relative h-full w-full overflow-hidden rounded-lg border ${interactive ? "" : "pointer-events-none"}`.trim()}
      data-movie-area
      ref={ref}
    >
      {isNearScreen ? (
        <Suspense
          fallback={
            <AspectRatioBox aspectHeight={1} aspectWidth={1}>
              <MediaPlaceholder />
            </AspectRatioBox>
          }
        >
          <PausableMovie src={getMoviePath(movie.id)} />
        </Suspense>
      ) : (
        <AspectRatioBox aspectHeight={1} aspectWidth={1}>
          <MediaPlaceholder />
        </AspectRatioBox>
      )}
    </div>
  );
};
