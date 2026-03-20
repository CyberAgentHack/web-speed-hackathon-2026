import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  hasMore: boolean;
  items: unknown[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, hasMore, items }: Props) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sentinelRef.current;
    if (element == null || !hasMore || items.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          fetchMore();
        }
      },
      {
        rootMargin: "200px 0px",
      },
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [fetchMore, hasMore, items.length]);

  return (
    <>
      {children}
      {hasMore ? <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" /> : null}
    </>
  );
};
