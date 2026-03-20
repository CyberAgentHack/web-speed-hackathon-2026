import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const latestItem = items[items.length - 1];
  const fetchMoreRef = useRef(fetchMore);
  fetchMoreRef.current = fetchMore;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && latestItem !== undefined) {
        fetchMoreRef.current();
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [latestItem]);

  return (
    <>
      {children}
      <div ref={sentinelRef} />
    </>
  );
};
