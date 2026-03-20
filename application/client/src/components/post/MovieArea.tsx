import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { PausableMovie } from "@web-speed-hackathon-2026/client/src/components/foundation/PausableMovie";
import { getMoviePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  movie: Models.Movie;
  prioritize?: boolean;
  variant?: "preview" | "interactive";
}

export const MovieArea = ({ movie, prioritize = false, variant = "interactive" }: Props) => {
  const src = getMoviePath(movie.id);

  return (
    <div
      className="border-cax-border bg-cax-surface-subtle relative h-full w-full overflow-hidden rounded-lg border"
      data-movie-area
    >
      {variant === "preview" ? (
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
        <PausableMovie src={src} />
      )}
    </div>
  );
};
