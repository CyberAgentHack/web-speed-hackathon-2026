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
    let frameId: number | null = null;

    const handler = () => {
      const hasReached =
        window.innerHeight + Math.ceil(window.scrollY) >= document.documentElement.scrollHeight;

      // 画面最下部にスクロールしたタイミングで、登録したハンドラを呼び出す
      if (hasReached && !prevReachedRef.current) {
        // アイテムがないときは追加で読み込まない
        if (latestItem !== undefined) {
          fetchMore();
        }
      }

      prevReachedRef.current = hasReached;
    };

    const scheduleHandler = () => {
      if (frameId !== null) {
        return;
      }
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        handler();
      });
    };

    // 最初は実行されないので手動で呼び出す
    prevReachedRef.current = false;
    scheduleHandler();

    window.addEventListener("resize", scheduleHandler, { passive: true });
    window.addEventListener("scroll", scheduleHandler, { passive: true });

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("resize", scheduleHandler);
      window.removeEventListener("scroll", scheduleHandler);
    };
  }, [latestItem, fetchMore]);

  return <>{children}</>;
};
