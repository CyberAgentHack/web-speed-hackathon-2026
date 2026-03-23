import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  hasMore?: boolean;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, hasMore = true, items }: Props) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const latestItem = items[items.length - 1];

  const fetchedRef = useRef(false);

  useEffect(() => {
    fetchedRef.current = false;
  }, [latestItem]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (latestItem === undefined || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !fetchedRef.current) {
          fetchedRef.current = true;
          fetchMore();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [latestItem, fetchMore, hasMore]);

  return (
    <>
      {children}
      <div ref={sentinelRef} />
    </>
  );
};
