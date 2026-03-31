import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const latestItem = items[items.length - 1];
  const sentinelRef = useRef<HTMLDivElement>(null);
  const prevReachedRef = useRef(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    prevReachedRef.current = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const hasReached = entries[0]?.isIntersecting ?? false;

        if (hasReached && !prevReachedRef.current) {
          if (latestItem !== undefined) {
            fetchMore();
          }
        }

        prevReachedRef.current = hasReached;
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [latestItem, fetchMore]);

  return (
    <>
      {children}
      <div ref={sentinelRef} />
    </>
  );
};
