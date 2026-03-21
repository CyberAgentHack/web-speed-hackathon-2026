import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const latestItem = items[items.length - 1];

  const prevReachedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const isScheduledRef = useRef(false);
  const latestItemRef = useRef(latestItem);

  useEffect(() => {
    latestItemRef.current = latestItem;
  }, [latestItem]);

  useEffect(() => {
    const run = () => {
      const hasReached =
        window.innerHeight + Math.ceil(window.scrollY) >= document.documentElement.scrollHeight;

      // 画面最下部にスクロールしたタイミングで、登録したハンドラを呼び出す
      if (hasReached && !prevReachedRef.current) {
        // アイテムがないときは追加で読み込まない
        if (latestItemRef.current !== undefined) {
          fetchMore();
        }
      }

      prevReachedRef.current = hasReached;
      isScheduledRef.current = false;
      animationFrameRef.current = null;
    };

    const handler = () => {
      if (isScheduledRef.current) {
        return;
      }

      isScheduledRef.current = true;
      animationFrameRef.current = window.requestAnimationFrame(run);
    };

    // 最初は実行されないので手動で呼び出す
    prevReachedRef.current = false;
    run();

    document.addEventListener("wheel", handler, { passive: true });
    document.addEventListener("touchmove", handler, { passive: true });
    document.addEventListener("resize", handler);
    document.addEventListener("scroll", handler, { passive: true });
    return () => {
      if (animationFrameRef.current != null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      document.removeEventListener("wheel", handler);
      document.removeEventListener("touchmove", handler);
      document.removeEventListener("resize", handler);
      document.removeEventListener("scroll", handler);
    };
  }, [fetchMore]);

  return <>{children}</>;
};
