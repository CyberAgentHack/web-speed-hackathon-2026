import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  hasMore: boolean;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, hasMore, items }: Props) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const wasIntersectingRef = useRef(false);
  const hasItemsRef = useRef(items.length > 0);

  useEffect(() => {
    hasItemsRef.current = items.length > 0;
  }, [items.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (sentinel == null) {
      return;
    }

    if (!hasMore) {
      return;
    }

    wasIntersectingRef.current = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry?.isIntersecting ?? false;

        if (
          isIntersecting &&
          !wasIntersectingRef.current &&
          hasItemsRef.current
        ) {
          fetchMore();
        }

        wasIntersectingRef.current = isIntersecting;
      },
      {
        root: null,
        threshold: 0,
        rootMargin: "0px 0px 300px 0px",
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [fetchMore, hasMore]);

  return (
    <>
      {children}
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />
    </>
    );
};
