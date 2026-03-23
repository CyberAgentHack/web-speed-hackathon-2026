import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: unknown[];
  fetchMore: () => void;
  hasMore: boolean;
}

export const InfiniteScroll = ({ children, fetchMore, hasMore, items }: Props) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasRequestedAtCurrentLengthRef = useRef(false);

  useEffect(() => {
    hasRequestedAtCurrentLengthRef.current = false;
  }, [items.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (sentinel == null || items.length === 0 || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries.some((entry) => entry.isIntersecting)
          && !hasRequestedAtCurrentLengthRef.current
        ) {
          hasRequestedAtCurrentLengthRef.current = true;
          fetchMore();
        }
      },
      {
        rootMargin: "200px 0px",
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [fetchMore, hasMore, items.length]);

  return (
    <>
      {children}
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />
    </>
  );
};
