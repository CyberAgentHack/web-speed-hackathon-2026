import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  fetchMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export const InfiniteScroll = ({ children, fetchMore, hasMore, isLoading }: Props) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (sentinel == null || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !isLoading) {
          fetchMore();
        }
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [fetchMore, hasMore, isLoading]);

  return (
    <>
      {children}
      {hasMore ? <div aria-hidden="true" className="h-px w-full" ref={sentinelRef} /> : null}
    </>
  );
};
