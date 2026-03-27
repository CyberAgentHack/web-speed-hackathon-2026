import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const latestItem = items[items.length - 1];

  const prevReachedRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const scheduledRef = useRef(false);

  useEffect(() => {
    const check = () => {
      const hasReached =
        window.innerHeight + Math.ceil(window.scrollY) >= document.body.offsetHeight;

      // 画面最下部にスクロールしたタイミングで、登録したハンドラを呼び出す
      if (hasReached && !prevReachedRef.current) {
        // アイテムがないときは追加で読み込まない
        if (latestItem !== undefined) {
          fetchMore();
        }
      }

      prevReachedRef.current = hasReached;
    };

    const handler = () => {
      if (scheduledRef.current) {
        return;
      }
      scheduledRef.current = true;
      rafIdRef.current = window.requestAnimationFrame(() => {
        scheduledRef.current = false;
        rafIdRef.current = null;
        check();
      });
    };

    // 最初は実行されないので手動で呼び出す
    prevReachedRef.current = false;
    check();

    document.addEventListener("wheel", handler, { passive: true });
    document.addEventListener("touchmove", handler, { passive: true });
    window.addEventListener("resize", handler, { passive: true });
    document.addEventListener("scroll", handler, { passive: true });
    return () => {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
      scheduledRef.current = false;
      document.removeEventListener("wheel", handler);
      document.removeEventListener("touchmove", handler);
      window.removeEventListener("resize", handler);
      document.removeEventListener("scroll", handler);
    };
  }, [latestItem, fetchMore]);

  return <>{children}</>;
};
