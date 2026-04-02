import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const fetchMoreRef = useRef(fetchMore);
  fetchMoreRef.current = fetchMore;

  const latestItemRef = useRef(items[items.length - 1]);
  latestItemRef.current = items[items.length - 1];

  const prevReachedRef = useRef(false);

  useEffect(() => {
    prevReachedRef.current = false;

    const handler = () => {
      const hasReached = window.innerHeight + Math.ceil(window.scrollY) >= document.body.offsetHeight;

      if (hasReached && !prevReachedRef.current) {
        if (latestItemRef.current !== undefined) {
          fetchMoreRef.current();
        }
      }

      prevReachedRef.current = hasReached;
    };

    // DOMの更新を待ってからチェック
    requestAnimationFrame(() => handler());

    document.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler, { passive: true });
    return () => {
      document.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, [items.length]);

  return <>{children}</>;
};
