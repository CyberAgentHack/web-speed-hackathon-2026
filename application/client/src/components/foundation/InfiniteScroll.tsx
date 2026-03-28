import { ReactNode, useEffect, useRef, memo } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = memo(({ children, fetchMore, items }: Props) => {
  // センチネル（見張り役）の要素を参照するためのRef
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // アイテムが空かどうかの判定用
  const hasItems = items.length > 0;

  useEffect(() => {
    const target = observerTarget.current;
    if (!target || !hasItems) return;

    // 交差を監視するObserverを作成
    const observer = new IntersectionObserver(
      (entries) => {
        // ターゲットが画面内（rootMargin内）に入った時だけ fetchMore を実行
        if (entries.isIntersecting) {
          fetchMore();
        }
      },
      {
        // 画面の最下部に来る少し前（200px手前）で読み込みを開始してユーザーを待たせない
        rootMargin: "200px", 
        threshold: 0.1,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [fetchMore, hasItems]); // アイテムの有無と関数が変わった時だけ再設定

  return (
    <>
      {children}
      {/* この div が画面に入ると fetchMore が呼ばれる */}
      <div ref={observerTarget} style={{ height: "20px", width: "100%" }} aria-hidden="true" />
    </>
  );
});

InfiniteScroll.displayName = "InfiniteScroll";
