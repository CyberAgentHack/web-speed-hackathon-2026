import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  hasMore?: boolean;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, hasMore = true, items }: Props) => {
  const latestItem = items[items.length - 1];

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && latestItem !== undefined) {
          fetchMore();
        }
      },
      { rootMargin: "0px 0px 200px 0px" },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [latestItem, fetchMore, hasMore]);

  return (
    <>
      {children}
      {hasMore && <div ref={sentinelRef} />}
    </>
  );
};
