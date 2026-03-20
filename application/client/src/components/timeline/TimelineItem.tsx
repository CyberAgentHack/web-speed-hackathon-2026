import { MouseEventHandler, Suspense, lazy, useCallback } from "react";
import { Link, useNavigate } from "react-router";

import { AvatarImage } from "@web-speed-hackathon-2026/client/src/components/foundation/AvatarImage";
import { ImageArea } from "@web-speed-hackathon-2026/client/src/components/post/ImageArea";
import { formatJapaneseDate, toIsoDateTime } from "@web-speed-hackathon-2026/client/src/utils/date";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

const MovieArea = lazy(async () =>
  import("@web-speed-hackathon-2026/client/src/components/post/MovieArea").then((module) => ({
    default: module.MovieArea,
  })),
);
const SoundArea = lazy(async () =>
  import("@web-speed-hackathon-2026/client/src/components/post/SoundArea").then((module) => ({
    default: module.SoundArea,
  })),
);
const TranslatableText = lazy(async () =>
  import("@web-speed-hackathon-2026/client/src/components/post/TranslatableText").then((module) => ({
    default: module.TranslatableText,
  })),
);

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
  prioritizeImage?: boolean;
}

export const TimelineItem = ({ post, prioritizeImage = false }: Props) => {
  const navigate = useNavigate();

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
    <article className="hover:bg-cax-surface-subtle px-1 sm:px-4" onClick={handleClick}>
      <div className="border-cax-border flex border-b px-2 pt-2 pb-4 sm:px-4">
        <div className="shrink-0 grow-0 pr-2 sm:pr-4">
          <Link
            className="border-cax-border bg-cax-surface-subtle block h-12 w-12 overflow-hidden rounded-full border hover:opacity-75 sm:h-16 sm:w-16"
            to={`/users/${post.user.username}`}
          >
            <AvatarImage
              alt={post.user.profileImage.alt}
              loading="eager"
              size={64}
              src={getProfileImagePath(post.user.profileImage.id)}
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
              <time dateTime={toIsoDateTime(post.createdAt)}>
                {formatJapaneseDate(post.createdAt)}
              </time>
            </Link>
          </p>
          <div className="text-cax-text leading-relaxed">
            <Suspense fallback={<><p>{post.text}</p><p><span className="text-cax-accent">Show Translation</span></p></>}>
              <TranslatableText text={post.text} />
            </Suspense>
          </div>
          {post.images?.length > 0 ? (
            <div className="relative mt-2 w-full">
              <ImageArea images={post.images} prioritizeLcpCandidate={prioritizeImage} variant="thumb" />
            </div>
          ) : null}
          {post.movie ? (
            <div className="relative mt-2 w-full">
              <Suspense fallback={
                <div className="border-cax-border bg-cax-surface-subtle overflow-hidden rounded-lg border" style={{ aspectRatio: "1/1" }} />
              }>
                <MovieArea movie={post.movie} />
              </Suspense>
            </div>
          ) : null}
          {post.sound ? (
            <div className="relative mt-2 w-full">
              <Suspense fallback={
                <div className="border-cax-border bg-cax-surface-subtle overflow-hidden rounded-lg border" style={{ minHeight: "100px" }} />
              }>
                <SoundArea sound={post.sound} />
              </Suspense>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
};
