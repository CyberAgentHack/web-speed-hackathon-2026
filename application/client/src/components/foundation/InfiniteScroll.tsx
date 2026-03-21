import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && items.length > 0) {
          fetchMore();
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchMore, items.length]);

  return (
    <>
      {children}
      <div ref={sentinelRef} style={{ height: 1 }} />
    </>
  );
};
