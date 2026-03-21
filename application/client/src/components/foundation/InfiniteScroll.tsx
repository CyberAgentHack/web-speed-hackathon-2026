import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const latestItem = items[items.length - 1];

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || latestItem === undefined) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        fetchMore();
      }
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [latestItem, fetchMore]);

  return (
    <>
      {children}
      <div ref={sentinelRef} style={{ height: '1px' }} />
    </>
  );
};
