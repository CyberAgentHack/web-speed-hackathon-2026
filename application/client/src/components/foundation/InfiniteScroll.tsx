import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

export const InfiniteScroll = ({
  children,
  fetchMore,
  items,
  hasMore = true,
  isLoading = false,
}: Props) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const latestItem = items[items.length - 1];

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // アイテムがないときは追加で読み込まない
    if (latestItem === undefined) return;

    // これ以上データがない or ロード中なら追加読み込みしない
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          fetchMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [latestItem, fetchMore, hasMore, isLoading]);

  return (
    <>
      {children}
      <div ref={sentinelRef} style={{ width: 0, height: 0 }} />
    </>
  );
};
