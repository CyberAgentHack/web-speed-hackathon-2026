import { ReactNode, useEffect, useRef, useState } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const latestItem = items[items.length - 1];
  const [sentinelElement, setSentinelElement] = useState<HTMLDivElement | null>(null);
  const prevIntersectingRef = useRef(false);

  useEffect(() => {
    if (sentinelElement === null) {
      return;
    }

    // Synchronize pagination with the browser's intersection observer.
    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries.some((entry) => entry.isIntersecting);
        if (isIntersecting && !prevIntersectingRef.current && latestItem !== undefined) {
          fetchMore();
        }
        prevIntersectingRef.current = isIntersecting;
      },
      { rootMargin: "400px 0px" },
    );

    prevIntersectingRef.current = false;
    observer.observe(sentinelElement);

    return () => {
      observer.disconnect();
    };
  }, [fetchMore, latestItem, sentinelElement]);

  return (
    <>
      {children}
      <div ref={setSentinelElement} aria-hidden="true" className="h-px w-full" />
    </>
  );
};
