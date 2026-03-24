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
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          fetchMore();
        }
      },
      {
        root: null,
        rootMargin: "120px 0px",
      },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [fetchMore]);

  useEffect(() => {
    const hasReachedBottom =
      window.innerHeight + Math.ceil(window.scrollY) >= document.documentElement.scrollHeight;
    if (hasReachedBottom) {
      fetchMore();
    }
  }, [items.length, fetchMore]);

  return (
    <>
      {children}
      <div className="h-px w-full" ref={sentinelRef} />
    </>
  );
};
