import { memo, useMemo } from "react";

import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { TranslatableText } from "@web-speed-hackathon-2026/client/src/components/post/TranslatableText";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

import { handleImageError } from "@web-speed-hackathon-2026/client/src/utils/error_handlers";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
});

interface Props {
  comment: Models.Comment;
}

export const CommentItem = memo(({ comment }: Props) => {
  const formattedDate = useMemo(() => {
    return dateFormatter.format(new Date(comment.createdAt));
  }, [comment.createdAt]);

  return (
    <article className="hover:bg-cax-surface-subtle px-1 sm:px-4">
      <div className="border-cax-border flex border-b px-2 pt-2 pb-4 sm:px-4">
        <div className="shrink-0 grow-0 pr-2 sm:pr-4">
          <Link
            className="border-cax-border bg-cax-surface-subtle block h-8 w-8 overflow-hidden rounded-full border hover:opacity-75 sm:h-12 sm:w-12"
            to={`/users/${comment.user.username}`}
          >
            <img
              alt={comment.user.profileImage.alt}
              src={getProfileImagePath(comment.user.profileImage.id, 64)}
              width={48}
              height={48}
              loading="lazy"
              decoding="async"
              onError={handleImageError}
              className="aspect-square"
            />
          </Link>
        </div>
        <div className="min-w-0 shrink grow">
          <p className="overflow-hidden text-xs text-ellipsis whitespace-nowrap">
            <Link
              className="text-cax-text pr-1 font-bold hover:underline"
              to={`/users/${comment.user.username}`}
            >
              {comment.user.name}
            </Link>
            <Link
              className="text-cax-text-muted pr-1 hover:underline"
              to={`/users/${comment.user.username}`}
            >
              @{comment.user.username}
            </Link>
          </p>
          <div className="text-cax-text text-sm leading-relaxed">
            <TranslatableText text={comment.text} />
          </div>
          <p className="text-cax-text-muted pt-1 text-xs">
            <time dateTime={new Date(comment.createdAt).toISOString()}>
              {formattedDate}
            </time>
          </p>
        </div>
      </div>
    </article>
  );
});

CommentItem.displayName = "CommentItem";
