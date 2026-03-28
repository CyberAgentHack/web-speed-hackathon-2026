import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const latestItem = items[items.length - 1];
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const latestItemRef = useRef(latestItem);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    latestItemRef.current = latestItem;
    isFetchingRef.current = false;
  }, [latestItem]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (sentinel == null) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const hasIntersecting = entries.some((entry) => entry.isIntersecting);
        if (!hasIntersecting || latestItemRef.current === undefined || isFetchingRef.current) {
          return;
        }

        isFetchingRef.current = true;
        fetchMore();
      },
      {
        root: null,
        rootMargin: "400px 0px",
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [latestItem, fetchMore]);

  return (
    <>
      {children}
      <div ref={sentinelRef} className="h-px w-full" />
    </>
  );
};
