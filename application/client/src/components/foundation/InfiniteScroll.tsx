import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (el === null) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && (entry.isIntersecting || entry.intersectionRatio > 0)) {
          fetchMore();
        }
      },
      { rootMargin: "0px", threshold: 0.01 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [fetchMore, items.length]);

  return (
    <>
      {children}
      <div ref={sentinelRef} />
    </>
  );
};
