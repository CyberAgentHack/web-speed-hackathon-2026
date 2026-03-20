import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const latestItem = items[items.length - 1];
  const sentinelRef = useRef<HTMLDivElement>(null);
  const lastRequestedItemRef = useRef<any>(undefined);

  useEffect(() => {
    if (latestItem === undefined) {
      lastRequestedItemRef.current = undefined;
      return;
    }

    const sentinel = sentinelRef.current;
    if (sentinel == null) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }
        if (lastRequestedItemRef.current === latestItem) {
          return;
        }

        lastRequestedItemRef.current = latestItem;
        fetchMore();
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
      <div aria-hidden className="h-px w-full" ref={sentinelRef} />
    </>
  );
};
