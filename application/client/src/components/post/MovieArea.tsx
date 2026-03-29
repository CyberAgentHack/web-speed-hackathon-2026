import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { PausableMovie } from "@web-speed-hackathon-2026/client/src/components/foundation/PausableMovie";
import { PausableVideo } from "@web-speed-hackathon-2026/client/src/components/foundation/PausableVideo";
import {
  getMoviePath,
  getMoviePosterPath,
} from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  movie: Models.Movie;
  prioritize?: boolean;
  variant?: "preview" | "interactive";
}

export const MovieArea = ({ movie, prioritize = false, variant = "interactive" }: Props) => {
  const extension = movie.extension ?? "gif";
  const src = getMoviePath(movie.id, extension);
  const posterSrc = getMoviePosterPath(movie.id);
  const isVideo = extension === "mp4" || extension === "webm";
  const isInteractive = variant === "interactive";

  return (
    <div
      className="border-cax-border bg-cax-surface-subtle relative h-full w-full overflow-hidden rounded-lg border"
      data-movie-area
    >
      {!isInteractive && !isVideo ? (
        <AspectRatioBox aspectHeight={1} aspectWidth={1}>
          <img
            alt="投稿されたGIF画像"
            className="h-full w-full object-cover"
            decoding="async"
            fetchPriority={prioritize ? "high" : "auto"}
            loading={prioritize ? "eager" : "lazy"}
            src={src}
          />
        </AspectRatioBox>
      ) : (
        isVideo ? (
          <PausableVideo poster={posterSrc} prioritize={prioritize} src={src} />
        ) : (
          <PausableMovie src={src} />
        )
      )}
    </div>
  );
};
