import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const latestItem = items[items.length - 1];

  const prevReachedRef = useRef(false);

  useEffect(() => {
    const handler = () => {
      const hasReached = window.innerHeight + Math.ceil(window.scrollY) >= document.body.offsetHeight;

      // 画面最下部にスクロールしたタイミングで、登録したハンドラを呼び出す
      if (hasReached && !prevReachedRef.current) {
        // アイテムがないときは追加で読み込まない
        if (latestItem !== undefined) {
          fetchMore();
        }
      }

      prevReachedRef.current = hasReached;
    };

    // 最初は実行されないので手動で呼び出す
    prevReachedRef.current = false;
    handler();

    document.addEventListener("wheel", handler, { passive: true });
    document.addEventListener("touchmove", handler, { passive: true });
    window.addEventListener("resize", handler, { passive: true });
    document.addEventListener("scroll", handler, { passive: true });
    return () => {
      document.removeEventListener("wheel", handler);
      document.removeEventListener("touchmove", handler);
      window.removeEventListener("resize", handler);
      document.removeEventListener("scroll", handler);
    };
  }, [latestItem, fetchMore]);

  return <>{children}</>;
};
