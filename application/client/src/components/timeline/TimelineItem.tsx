const jaDateFormat = new Intl.DateTimeFormat("ja", { year: "numeric", month: "long", day: "numeric" });
import { lazy, memo, MouseEventHandler, Suspense, useCallback } from "react";
import { Link, useNavigate } from "react-router";

const ImageArea = lazy(() => import("@web-speed-hackathon-2026/client/src/components/post/ImageArea").then(m => ({ default: m.ImageArea })));
const MovieArea = lazy(() => import("@web-speed-hackathon-2026/client/src/components/post/MovieArea").then(m => ({ default: m.MovieArea })));
const SoundArea = lazy(() => import("@web-speed-hackathon-2026/client/src/components/post/SoundArea").then(m => ({ default: m.SoundArea })));
import { TranslatableText } from "@web-speed-hackathon-2026/client/src/components/post/TranslatableText";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

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
}

export const TimelineItem = memo(({ post }: Props) => {
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
            <img
              alt={post.user.profileImage.alt}
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
              <time dateTime={new Date(post.createdAt).toISOString()}>
                {jaDateFormat.format(new Date(post.createdAt))}
              </time>
            </Link>
          </p>
          <div className="text-cax-text leading-relaxed">
            <TranslatableText text={post.text} />
          </div>
          <Suspense fallback={null}>
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
          </Suspense>
        </div>
      </div>
    </article>
  );
});
