import { formatLongDate } from "@web-speed-hackathon-2026/client/src/utils/format_date";
import { MouseEventHandler, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

import { ImageArea } from "@web-speed-hackathon-2026/client/src/components/post/ImageArea";
import { MovieArea } from "@web-speed-hackathon-2026/client/src/components/post/MovieArea";
import { SoundArea } from "@web-speed-hackathon-2026/client/src/components/post/SoundArea";
import { TranslatableText } from "@web-speed-hackathon-2026/client/src/components/post/TranslatableText";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

const isClickedInteractiveElement = (target: EventTarget | null, currentTarget: Element): boolean => {
  while (target !== null && target instanceof Element) {
    const tagName = target.tagName.toLowerCase();
    if (tagName === "a") {
      return true;
    }
    if (tagName === "button" && (target as HTMLElement).getAttribute("aria-label") !== "動画プレイヤー") {
      return true;
    }
    if (currentTarget === target) {
      return false;
    }
    target = target.parentNode;
  }
  return false;
};

interface Props {
  post: Models.Post;
  isPriority?: boolean;
}

export const TimelineItem = ({ post, isPriority = false }: Props) => {
  const navigate = useNavigate();
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(isPriority);

  useEffect(() => {
    if (isPriority) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isPriority]);

  const handleClick = useCallback<MouseEventHandler>(
    (ev) => {
      const isSelectedText = document.getSelection()?.isCollapsed === false;
      if (!isClickedInteractiveElement(ev.target, ev.currentTarget) && !isSelectedText) {
        navigate(`/posts/${post.id}`);
      }
    },
    [post, navigate],
  );

  if (!isVisible) {
    return <article ref={ref} className="px-1 sm:px-4" style={{ minHeight: "120px" }} />;
  }

  return (
    <article ref={ref} className="hover:bg-cax-surface-subtle px-1 sm:px-4" onClick={handleClick}>
      <div className="border-cax-border flex border-b px-2 pt-2 pb-4 sm:px-4">
        <div className="shrink-0 grow-0 pr-2 sm:pr-4">
          <Link
            className="border-cax-border bg-cax-surface-subtle block h-12 w-12 overflow-hidden rounded-full border hover:opacity-75 sm:h-16 sm:w-16"
            to={`/users/${post.user.username}`}
          >
            <img
              alt={post.user.profileImage.alt}
              decoding={isPriority ? "sync" : "async"}
              fetchPriority={isPriority ? "high" : "auto"}
              loading={isPriority ? "eager" : "lazy"}
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
              <time dateTime={new Date(post.createdAt).toISOString()}>
                {formatLongDate(post.createdAt)}
              </time>
            </Link>
          </p>
          <div className="text-cax-text leading-relaxed">
            <TranslatableText text={post.text} />
          </div>
          {post.images?.length > 0 ? (
            <div className="relative mt-2 w-full">
              <ImageArea images={post.images} isPriority={isPriority} />
            </div>
          ) : null}
          {post.movie ? (
            <div className="relative mt-2 w-full">
              <MovieArea movie={post.movie} showControls={false} />
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
