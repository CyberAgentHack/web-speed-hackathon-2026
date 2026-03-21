import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const latestItem = items[items.length - 1];
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (sentinel == null || latestItem === undefined) {
      hasRequestedRef.current = false;
      return;
    }

    hasRequestedRef.current = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !hasRequestedRef.current) {
          hasRequestedRef.current = true;
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
  }, [latestItem, fetchMore]);

  return (
    <>
      {children}
      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
    </>
  );
};
