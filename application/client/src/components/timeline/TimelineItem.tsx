import { MouseEventHandler, useCallback } from "react";
import { Link, useNavigate } from "react-router";

import { ProfileAvatar } from "@web-speed-hackathon-2026/client/src/components/foundation/ProfileAvatar";
import { ImageArea } from "@web-speed-hackathon-2026/client/src/components/post/ImageArea";
import { MovieArea } from "@web-speed-hackathon-2026/client/src/components/post/MovieArea";
import { SoundArea } from "@web-speed-hackathon-2026/client/src/components/post/SoundArea";
import { TranslatableText } from "@web-speed-hackathon-2026/client/src/components/post/TranslatableText";

const isClickedAnchorOrButton = (target: EventTarget | null, currentTarget: Element): boolean => {
  while (target !== null && target instanceof Element) {
    const tagName = target.tagName.toLowerCase();
    if (["button", "a"].includes(tagName)) {
      return true;
    }
    if (currentTarget === target) {
      return false;
    }
    target = target.parentNode;
  }
  return false;
};

/**
 * @typedef {object} Props
 * @property {Models.Post} post
 */
interface Props {
  post: Models.Post;
  prioritizeMedia?: boolean;
}

export const TimelineItem = ({ post, prioritizeMedia = false }: Props) => {
  const navigate = useNavigate();
  const createdAt = new Date(post.createdAt);
  const createdAtLabel = new Intl.DateTimeFormat("ja-JP", { dateStyle: "long" }).format(createdAt);

  /**
   * ボタンやリンク以外の箇所をクリックしたとき かつ 文字が選択されてないとき、投稿詳細ページに遷移する
   */
  const handleClick = useCallback<MouseEventHandler>(
    (ev) => {
      const isSelectedText = document.getSelection()?.isCollapsed === false;
      if (!isClickedAnchorOrButton(ev.target, ev.currentTarget) && !isSelectedText) {
        navigate(`/posts/${post.id}`);
      }
    },
    [post, navigate],
  );

  return (
    <article className="timeline-item hover:bg-cax-surface-subtle px-1 sm:px-4" onClick={handleClick}>
      <div className="timeline-item__body border-cax-border flex border-b px-2 pt-2 pb-4 sm:px-4">
        <div className="timeline-item__avatar shrink-0 grow-0 pr-2 sm:pr-4">
          <Link
            className="timeline-item__avatar-link border-cax-border bg-cax-surface-subtle block h-12 w-12 overflow-hidden rounded-full border hover:opacity-75 sm:h-16 sm:w-16"
            to={`/users/${post.user.username}`}
          >
            <ProfileAvatar
              alt={post.user.profileImage.alt}
              imageId={post.user.profileImage.id}
            />
          </Link>
        </div>
        <div className="timeline-item__main min-w-0 shrink grow">
          <p className="timeline-item__meta overflow-hidden text-sm text-ellipsis whitespace-nowrap">
            <Link
              className="text-cax-text pr-1 font-bold hover:underline"
              to={`/users/${post.user.username}`}
            >
              {post.user.name}
            </Link>
            <Link
              className="text-cax-text-muted pr-1 hover:underline"
              to={`/users/${post.user.username}`}
            >
              @{post.user.username}
            </Link>
            <span className="text-cax-text-muted pr-1">-</span>
            <Link className="text-cax-text-muted pr-1 hover:underline" to={`/posts/${post.id}`}>
              <time dateTime={createdAt.toISOString()}>{createdAtLabel}</time>
            </Link>
          </p>
          <div className="timeline-item__text text-cax-text leading-relaxed">
            <TranslatableText text={post.text} />
          </div>
          {post.images?.length > 0 ? (
            <div className="timeline-item__media relative mt-2 w-full">
              <ImageArea images={post.images} prioritize={prioritizeMedia} />
            </div>
          ) : null}
          {post.movie ? (
            <div className="timeline-item__media relative mt-2 w-full">
              <MovieArea movie={post.movie} prioritize={prioritizeMedia} variant="preview" />
            </div>
          ) : null}
          {post.sound ? (
            <div className="timeline-item__media relative mt-2 w-full">
              <SoundArea sound={post.sound} />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
};
