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
    if (sentinel === null || items.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          fetchMore();
        }
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [fetchMore, items.length]);

  return (
    <>
      {children}
      <div ref={sentinelRef} aria-hidden={true} className="h-px w-full" />
    </>
  );
};
