import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  items: unknown[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const latestItem = items[items.length - 1];
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = sentinelRef.current;
    if (target === null) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        // アイテムがないときは追加で読み込まない
        if (latestItem !== undefined) {
          fetchMore();
        }
      },
      {
        root: null,
        rootMargin: "200px 0px",
        threshold: 0,
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [latestItem, fetchMore]);

  return (
    <>
      {children}
      <div aria-hidden className="h-px w-full" ref={sentinelRef} />
    </>
  );
};
