import { MouseEventHandler, useCallback } from "react";
import { Link, useNavigate } from "react-router";

import { LazyImage } from "@web-speed-hackathon-2026/client/src/components/foundation/LazyImage";
import { ImageArea } from "@web-speed-hackathon-2026/client/src/components/post/ImageArea";
import { MovieArea } from "@web-speed-hackathon-2026/client/src/components/post/MovieArea";
import { SoundArea } from "@web-speed-hackathon-2026/client/src/components/post/SoundArea";
import { TranslatableText } from "@web-speed-hackathon-2026/client/src/components/post/TranslatableText";
import { formatLongDate, toISOString } from "@web-speed-hackathon-2026/client/src/utils/date";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

const isClickedInteractiveElement = (
  target: EventTarget | null,
  currentTarget: Element,
): boolean => {
  while (target !== null && target instanceof Element) {
    const tagName = target.tagName.toLowerCase();
    if (tagName === "a") {
      return true;
    }
    if (tagName === "button") {
      // タイムライン上の動画プレビューは投稿詳細へ遷移させる
      const hasPreviewMovie =
        target.querySelector("video") !== null || target.querySelector("canvas") !== null;
      if (!hasPreviewMovie) {
        return true;
      }
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
  prioritizeRendering?: boolean;
}

export const TimelineItem = ({
  post,
  prioritizeMedia = false,
  prioritizeRendering = false,
}: Props) => {
  const navigate = useNavigate();
  const visibilityStyle = prioritizeRendering
    ? undefined
    : {
        containIntrinsicSize: "auto 24rem",
        contentVisibility: "auto" as const,
      };

  /**
   * ボタンやリンク以外の箇所をクリックしたとき かつ 文字が選択されてないとき、投稿詳細ページに遷移する
   */
  const handleClick = useCallback<MouseEventHandler>(
    (ev) => {
      const isSelectedText = document.getSelection()?.isCollapsed === false;
      if (!isClickedInteractiveElement(ev.target, ev.currentTarget) && !isSelectedText) {
        navigate(`/posts/${post.id}`);
      }
    },
    [post, navigate],
  );

  return (
    <article className="hover:bg-cax-surface-subtle px-1 sm:px-4" onClick={handleClick} style={visibilityStyle}>
      <div className="border-cax-border flex border-b px-2 pt-2 pb-4 sm:px-4">
        <div className="shrink-0 grow-0 pr-2 sm:pr-4">
          <Link
            className="border-cax-border bg-cax-surface-subtle block h-12 w-12 overflow-hidden rounded-full border hover:opacity-75 sm:h-16 sm:w-16"
            to={`/users/${post.user.username}`}
          >
            <LazyImage
              alt={post.user.profileImage.alt}
              src={getProfileImagePath(post.user.profileImage.id, 64)}
            />
          </Link>
        </div>
        <div className="min-w-0 shrink grow">
          <p className="overflow-hidden text-sm text-ellipsis whitespace-nowrap">
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
              <time dateTime={toISOString(post.createdAt)}>
                {formatLongDate(post.createdAt)}
              </time>
            </Link>
          </p>
          <div className="text-cax-text leading-relaxed">
            <TranslatableText text={post.text} />
          </div>
          {post.images?.length > 0 ? (
            <div className="relative mt-2 w-full">
              <ImageArea images={post.images} prioritizeFirstImage={prioritizeMedia} />
            </div>
          ) : null}
          {post.movie ? (
            <div className="relative mt-2 w-full">
              <MovieArea interactive={false} movie={post.movie} priority={prioritizeMedia} />
            </div>
          ) : null}
          {post.sound ? (
            <div className="relative mt-2 w-full">
              <SoundArea sound={post.sound} />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
};
