import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const latestItem = items[items.length - 1];
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (latestItem === undefined || sentinelRef.current == null) {
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

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [latestItem, fetchMore]);

  return (
    <>
      {children}
      <div ref={sentinelRef} className="h-px w-full" />
    </>
  );
};
