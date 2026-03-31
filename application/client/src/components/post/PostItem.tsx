import { formatLongDate, toISOString } from "@web-speed-hackathon-2026/client/src/utils/date";

import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { ImageArea } from "@web-speed-hackathon-2026/client/src/components/post/ImageArea";
import { MovieArea } from "@web-speed-hackathon-2026/client/src/components/post/MovieArea";
import { SoundArea } from "@web-speed-hackathon-2026/client/src/components/post/SoundArea";
import { TranslatableText } from "@web-speed-hackathon-2026/client/src/components/post/TranslatableText";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  post: Models.Post;
}

export const PostItem = ({ post }: Props) => {
  return (
    <article className="px-1 sm:px-4">
      <div className="border-cax-border border-b px-4 pt-4 pb-4">
        <div className="flex items-center justify-center">
          <div className="shrink-0 grow-0 pr-2">
            <Link
              className="border-cax-border bg-cax-surface-subtle block h-14 w-14 overflow-hidden rounded-full border hover:opacity-95 sm:h-16 sm:w-16"
              to={`/users/${post.user.username}`}
            >
              <img
                alt={post.user.profileImage?.alt ?? ""}
                src={post.user.profileImage ? getProfileImagePath(post.user.profileImage.id) : ""}
              />
            </Link>
          </div>
          <div className="min-w-0 shrink grow overflow-hidden text-ellipsis whitespace-nowrap">
            <p>
              <Link
                className="text-cax-text font-bold hover:underline"
                to={`/users/${post.user.username}`}
              >
                {post.user.name}
              </Link>
            </p>
            <p>
              <Link
                className="text-cax-text-muted hover:underline"
                to={`/users/${post.user.username}`}
              >
                @{post.user.username}
              </Link>
            </p>
          </div>
        </div>
        <div className="pt-2 sm:pt-4">
          <div className="text-cax-text text-xl leading-relaxed">
            <TranslatableText text={post.text} />
          </div>
          {post.images?.length > 0 ? (
            <div className="relative mt-2 w-full">
              <ImageArea images={post.images} />
            </div>
          ) : null}
          {post.movie ? (
            <div className="relative mt-2 w-full">
              <MovieArea movie={post.movie} />
            </div>
          ) : null}
          {post.sound ? (
            <div className="relative mt-2 w-full">
              <SoundArea sound={post.sound} />
            </div>
          ) : null}
          <p className="mt-2 text-sm sm:mt-4">
            <Link className="text-cax-text-muted hover:underline" to={`/posts/${post.id}`}>
              <time dateTime={toISOString(post.createdAt)}>
                {formatLongDate(post.createdAt)}
              </time>
            </Link>
          </p>
        </div>
      </div>
    </article>
  );
};
