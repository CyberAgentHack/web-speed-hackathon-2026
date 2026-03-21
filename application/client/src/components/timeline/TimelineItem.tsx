import { Link } from "react-router";

import { ImageArea } from "@web-speed-hackathon-2026/client/src/components/post/ImageArea";
import { MovieArea } from "@web-speed-hackathon-2026/client/src/components/post/MovieArea";
import { SoundArea } from "@web-speed-hackathon-2026/client/src/components/post/SoundArea";
import { TranslatableText } from "@web-speed-hackathon-2026/client/src/components/post/TranslatableText";
import { formatJaLongDate } from "@web-speed-hackathon-2026/client/src/utils/format_date";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  post: Models.Post;
  priority?: boolean;
}

export const TimelineItem = ({ post, priority }: Props) => {
  return (
    <article className="hover:bg-cax-surface-subtle relative px-1 sm:px-4">
      <Link
        aria-hidden="true"
        className="absolute inset-0"
        tabIndex={-1}
        to={`/posts/${post.id}`}
      />
      <div className="border-cax-border flex border-b px-2 pt-2 pb-4 sm:px-4">
        <div className="relative z-1 shrink-0 grow-0 pr-2 sm:pr-4">
          <Link
            className="border-cax-border bg-cax-surface-subtle block h-12 w-12 overflow-hidden rounded-full border hover:opacity-75 sm:h-16 sm:w-16"
            to={`/users/${post.user.username}`}
          >
            <img
              alt={post.user.profileImage.alt}
              className="h-full w-full object-cover"
              decoding="async"
              height={64}
              loading="lazy"
              src={getProfileImagePath(post.user.profileImage.id)}
              width={64}
            />
          </Link>
        </div>
        <div className="min-w-0 shrink grow">
          <p className="overflow-hidden text-sm text-ellipsis whitespace-nowrap">
            <Link
              className="text-cax-text relative z-1 pr-1 font-bold hover:underline"
              to={`/users/${post.user.username}`}
            >
              {post.user.name}
            </Link>
            <Link
              className="text-cax-text-muted relative z-1 pr-1 hover:underline"
              to={`/users/${post.user.username}`}
            >
              @{post.user.username}
            </Link>
            <span className="text-cax-text-muted pr-1">-</span>
            <Link
              className="text-cax-text-muted relative z-1 pr-1 hover:underline"
              to={`/posts/${post.id}`}
            >
              <time dateTime={new Date(post.createdAt).toISOString()}>
                {formatJaLongDate(post.createdAt)}
              </time>
            </Link>
          </p>
          <div className="text-cax-text leading-relaxed">
            <TranslatableText text={post.text} />
          </div>
          {post.images?.length > 0 ? (
            <div className="relative z-1 mt-2 w-full">
              <ImageArea images={post.images} {...(priority ? { priority: true } : {})} />
            </div>
          ) : null}
          {post.movie ? (
            <div className="relative z-1 mt-2 w-full">
              <MovieArea movie={post.movie} />
            </div>
          ) : null}
          {post.sound ? (
            <div className="relative z-1 mt-2 w-full">
              <SoundArea sound={post.sound} />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
};
