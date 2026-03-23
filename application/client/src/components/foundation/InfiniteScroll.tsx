import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const observerTarget = useRef<HTMLDivElement>(null);
  const latestItem = items[items.length - 1];
  const fetchMoreRef = useRef(fetchMore);

  // fetchMore が変わっても observer を再作成しないように ref に保持
  useEffect(() => {
    fetchMoreRef.current = fetchMore;
  }, [fetchMore]);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && latestItem !== undefined) {
          fetchMoreRef.current();
        }
      },
      {
        rootMargin: "1000px", // 1000px 手前で読み込みを開始する
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [latestItem]); // latestItem が変わる（＝アイテムが追加される）たびに判定をリセット

  return (
    <>
      {children}
      {/* この透明な div が画面に入ると fetchMore が呼ばれる */}
      <div ref={observerTarget} className="h-1 w-full opacity-0" />
    </>
  );
};
