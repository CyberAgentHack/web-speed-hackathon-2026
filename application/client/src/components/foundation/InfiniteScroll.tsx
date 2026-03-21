import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const latestItem = items[items.length - 1];
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchMoreRef = useRef(fetchMore);
  fetchMoreRef.current = fetchMore;

  const latestItemRef = useRef(latestItem);
  latestItemRef.current = latestItem;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && latestItemRef.current !== undefined) {
          fetchMoreRef.current();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [items.length]);

  return (
    <>
      {children}
      <div ref={sentinelRef} />
    </>
  );
};
