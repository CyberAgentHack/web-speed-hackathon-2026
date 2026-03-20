import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
  hasMore?: boolean;
}

export const InfiniteScroll = ({ children, fetchMore, hasMore = true, items }: Props) => {
  const latestItem = items[items.length - 1];

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) {
      return;
    }

    const sentinel = sentinelRef.current;

    if (sentinel === null) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && latestItem !== undefined) {
          fetchMore();
        }
      },
      {
        root: null,
        rootMargin: "0px 0px 200px 0px",
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, latestItem, fetchMore]);

  return (
    <>
      {children}
      <div aria-hidden="true" ref={sentinelRef} style={{ blockSize: 1 }} />
    </>
  );
};
